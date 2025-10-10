
export async function regSW() {
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported.");
    return null; 
  }

  try {
    const registration = await navigator.serviceWorker.register("serviceWork.js");
    console.log("Service worker registration successful:", registration.scope);

    registration.onupdatefound = () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.onstatechange = () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage({ action: "skipWaiting" });
          requestRefresh();
        }
      };
    };

    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    throw err; 
  }
}

function requestRefresh(){
    //console.log("DO REFRESH...");
    window.location.reload();
}