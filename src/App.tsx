import React, { Component, createElement, createRef, RefObject } from "react";
import { Navigator } from "react-onsenui";
import { TileInit, GoToErrorPage } from "./services/helper.svc";
import { tile } from "./services/container.svc";
import LoadingScreen from "./components/LoadingScreen";

class App extends Component<any, any> {
  // create a reference to the onsen Navigator
  navEl: RefObject<Navigator> = createRef();
  state = {
    loading: true
  };

  /* only render the onsen navigator
    Let the tileInit decide what to do
   */
  render() {
    const renderPage = (route: any, appNavigator: Navigator) => {
      console.log("renderpage");
      // @ts-ignore
      if (!appNavigator.clone) {
        appNavigator = this.initTileAndNavigatorForPlatform(appNavigator);
      }

      const props = route.props || {};
      props.navigator = appNavigator;

      return createElement(route.component, props);
    };

    return (
      <>
        <Navigator id="AppNavigator" key="AppNavigator" renderPage={renderPage} ref={this.navEl} />
        {this.state.loading && <LoadingScreen className="cdp-startup-loader" />}
      </>
    );
  }

  componentDidMount() {
    // The navigator is rendered now Init the Tile by getting the TileConfig and any openData
    // if this fails go to error page
    const nav = this.navEl.current;
    if (nav) {
      this.waitForCDPGlobals()
        .then(() => TileInit(nav))
        .then(
          () => {
            console.log("Tile Init Success");
            this.setState({ loading: false });
          },
          (msg) => {
            console.log("Tile Init Failed:", msg);
            this.setState({ loading: false });
            GoToErrorPage(nav);
          }
        );
    }
  }

  waitForCDPGlobals(timeoutMs = 1000, pollMs = 50): Promise<void> {
    const started = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const c: any = (window as any).container;
        const ready =
          !!c &&
          !!c.tile &&
          !!c.tile.data &&
          typeof c.tile.data.getTileConfig === "function" &&
          !!c.connectors;

        if (ready) {
          resolve();
          return;
        }

        if (Date.now() - started >= timeoutMs) {
          // Continue anyway; TileInit will handle failure paths.
          resolve();
          return;
        }

        setTimeout(tick, pollMs);
      };
      tick();
    });
  }



  /* set up the react onsen nav to play nice with the container nav
   */
  initTileAndNavigatorForPlatform(appNavigator: Navigator): any {
    // This is exists to prevent promises from not resolving with the container

    // @ts-ignore
    appNavigator.clone = appNavigator._navi;

    // @ts-ignore
    appNavigator.clone.pushPage = () => {
      console.log("clone pushing page...");
      console.log(appNavigator);
    };

    // @ts-ignore
    tile.popPanel = () => {
      appNavigator.popPage().then((ok: any) => {
        console.log("clone navigator pop");
      });
    };

    return appNavigator;
  }
}

export default App;
