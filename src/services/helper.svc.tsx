import ErrorPage from "../pages/CDP/ErrorPage";
import MetaActionsEnum from "../models/CDP/MetaAction/MetaAction.enum";
import OpenPageActionModel from "../models/CDP/MetaAction/OpenPageAction.model";
import ConnectorActionModel from "../models/CDP/MetaAction/ConnectorAction.model";
import OpenTileActionModel from "../models/CDP/MetaAction/OpenTileAction.model";
import RequestFileModel from "../models/CDP/MetaAction/RequestFile.model";
import ContainerResponse from "../models/CDP/ContainerResponse.model";
import { container, tile, sendRequest } from "./container.svc";
import { Navigator } from "react-onsenui";
import HomePage from "../pages/HomePage";

export function isNativeApp(): boolean {
  return container.helper.isNativeApp();
}

const pageList = {
  HomePage
};

export function GetTileConfig(): Promise<any> {
  return new Promise((resolve, reject) => {
    container.tile.data.loadJsonFile("tileconfig.json", (res: ContainerResponse) => {
      const data = JSON.parse(JSON.stringify(res).replace(/&#x2F;/g, "/"));

      if (!data.success) {
        reject();
        return;
      }

      tile.tileConfig = data.data.filecontent;
      resolve(data.data.filecontent);
    });
  });
}

export function GetContainerOpenData(): Promise<any> {
  return new Promise((resolve) => {
    const getOpenData = container?.tile?.data?.getOpenData;
    const started = Date.now();
    const timeoutMs = 1000;
    const pollMs = 100;

    if (typeof getOpenData !== "function") {
      resolve(null);
      return;
    }

    const tryRead = () => {
      getOpenData((response: ContainerResponse) => {
        const openData =
          response?.data?.opendata ??
          response?.data?.openData ??
          response?.data?.open_data ??
          response?.opendata ??
          response?.openData ??
          null;

        if (response?.success && openData) {
          resolve(openData);
          return;
        }

        if (response && response.success === false) {
          resolve(null);
          return;
        }

        if (Date.now() - started >= timeoutMs) {
          resolve(null);
          return;
        }

        setTimeout(tryRead, pollMs);
      });
    };

    tryRead();
  });
}

const getFunctionFromString = (functionString: string) => {
  let scope: any = window;
  const scopeSplit = functionString.split(".");

  for (let i = 0; i < scopeSplit.length - 1; i += 1) {
    scope = scope[scopeSplit[i]];
    if (!scope) {
      return undefined;
    }
  }

  return scope[scopeSplit[scopeSplit.length - 1]];
};

export function TileInit(nav: Navigator): Promise<string> {
  return new Promise((resolve, reject) => {
    container.tile.data.loadStrings(() =>
      GetTileConfig().then(
        (config) => {
          GetContainerOpenData().then((openData) => {
            const metaAction = openData ?? config.openData;

            if (metaAction == null) {
              reject("No meta action");
              return;
            }

            ProcessMetaAction(metaAction, nav, config)
              .then(() => resolve("success"))
              .catch(reject);
          });
        },
        () => {
          reject("No Tile Config");
        }
      )
    );
  });
}

export function ProcessMetaAction(
  action: any,
  navigator: Navigator,
  methods?: any
): Promise<any> {
  return new Promise<void>((resolve, reject) => {
    const newAction: any = JSON.parse(JSON.stringify(action));
    const openTileAction: OpenTileActionModel = action;

    switch (action.actionType) {
      case MetaActionsEnum.OpenTile: {
        container.tile.openTile(
          openTileAction.tileCode,
          openTileAction.tileVersion,
          () => undefined,
          openTileAction.openData
        );
        resolve();
        break;
      }

      case MetaActionsEnum.CallConnector: {
        const connectorAction: ConnectorActionModel = action;
        const params = connectorAction.params || {};

        container.connectors.sendRequest(
          connectorAction.connectorName,
          connectorAction.connectorVersion,
          connectorAction.connectorMethod,
          params,
          (response: any) => {
            if (!connectorAction.callBackFunc) {
              ProcessMetaAction(response, navigator).then((result) => resolve(result));
              return;
            }

            resolve(response);
          }
        );
        break;
      }

      case MetaActionsEnum.OpenPage: {
        const openPageAction: OpenPageActionModel = action;
        const component = pageList[openPageAction.component as keyof typeof pageList];

        if (!component) {
          GoToErrorPage(navigator);
          reject(`Unknown page component "${openPageAction.component}"`);
          return;
        }

        const componentModel = openPageAction.openData;

        navigator
          .pushPage({
            component,
            props: {
              componentModel,
              methods
            }
          })
          .then(() => {
            const clone = (navigator as any).clone;
            container.tile.navigation.pushPanelWithTitle(
              clone,
              openPageAction.pageName,
              openPageAction.pageTitle
            );
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
        break;
      }

      case MetaActionsEnum.JsFunction: {
        if (methods && methods[action.functionName]) {
          const jsParams = Object.values(action.params || {});
          methods[action.functionName](...jsParams);
          resolve();
          return;
        }

        if (action.functionName?.includes("container")) {
          const fnName = getFunctionFromString(action.functionName);
          const fnParams = action.params;

          if (typeof fnName === "function") {
            fnName(fnParams, (response: any) => {
              if (!response?.success) {
                reject();
              }
            });
            resolve();
            return;
          }
        }

        reject(`No such function name "${action.functionName}"`);
        break;
      }

      case MetaActionsEnum.FromLanding: {
        newAction.actionType = MetaActionsEnum.OpenPage;

        if (isNativeApp()) {
          ProcessMetaAction(newAction, navigator, methods);
        } else {
          delete newAction.pageTitle;
          container.tile.openTile(
            tile.tileConfig.config.tileInfo.code,
            tile.tileConfig.config.tileInfo.version,
            () => undefined,
            newAction,
            "_blank",
            "large",
            () => {
              if (methods?.[action.functionName]) {
                methods[action.functionName]();
                return;
              }

              reject(`No such function name "${action.functionName}"`);
            }
          );
        }

        resolve();
        break;
      }

      case MetaActionsEnum.RequestFile: {
        const requestFileAction: RequestFileModel = action;
        const fileParams = requestFileAction.params || {};

        container.connectors.sendFileRequest(
          requestFileAction.connectorName,
          requestFileAction.connectorVersion,
          requestFileAction.connectorMethod,
          fileParams,
          requestFileAction.mimeType,
          requestFileAction.filename,
          (response: any) => resolve(response),
          requestFileAction.generateText,
          requestFileAction.downloadText
        );
        break;
      }

      case MetaActionsEnum.OpenTileModal: {
        container.tile.openTile(
          openTileAction.tileCode,
          openTileAction.tileVersion,
          () => undefined,
          openTileAction.openData,
          "_blank",
          "large"
        );
        resolve();
        break;
      }

      default:
        reject();
        break;
    }
  });
}

export function GoToErrorPage(navigator: any) {
  setTimeout(() => {
    navigator
      .pushPage({
        component: ErrorPage,
        props: {
          navigator
        }
      })
      .then(() => {
        container.tile.navigation.pushPanelWithTitle(
          navigator.clone,
          "ErrorPage",
          "Error Page"
        );
      });
  }, 1000);
}
