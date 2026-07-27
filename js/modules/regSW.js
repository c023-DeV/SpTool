export async function regSW() {
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("serviceWork.js", {
      scope: "/",
      updateViaCache: "none",
    });
    console.log("Service worker registration successful:", registration.scope);

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          console.log("[App] New version available");
          newWorker.postMessage({ action: "skipWaiting" });

          navigator.serviceWorker.addEventListener("controllerchange", () => {
            window.location.reload();
          });
        }
      });
    });

    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    throw err;
  }
}