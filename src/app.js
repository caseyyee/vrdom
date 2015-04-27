var utils = require('./libs/utils');

module.exports = function() {
  'use strict';

  let vrDevices;
  let rightEyeCamera = document.getElementById('camera-left');
  let leftEyeCamera = document.getElementById('camera-right');
  let fsContainer = document.getElementById('view');
  let content = document.getElementById('content');

  let position, oq, pq, cssOrientationMatrix;

  const resize = () => {
    let width = window.innerWidth;
    let height = window.innerHeight;
  };

  window.addEventListener('resize', resize, false);
  resize();

  const filterInvalidDevices = (devices) => {
    // Exclude Cardboard position sensor if Oculus exists.
    let oculusDevices = devices.filter((device) => {
      return device.deviceName.toLowerCase().indexOf('oculus') !== -1;
    });

    if (oculusDevices.length >= 1) {
      return devices.filter((device) => {
        return device.deviceName.toLowerCase().indexOf('cardboard') === -1;
      });
    } else {
      return devices;
    }
  };

  const vrDeviceCallback = (devices) => {
    devices = filterInvalidDevices(devices);

    let headset;
    let position;

    for (let i = 0; i < devices.length; i++) {
      let device = devices[i];
      if (device instanceof HMDVRDevice) {
        headset = device;
      }
      if (device instanceof PositionSensorVRDevice) {
        position = device;
      }
      if (position && headset) {
        return ({
          headset: headset,
          position: position
        });
      }
    };

    return false;
  };

  const getVrDevices = () => {
    return new Promise((resolve, reject) => {
      if (navigator.getVRDevices) {
        navigator.getVRDevices().then(devices => {
          resolve(vrDeviceCallback(devices));
        });
      } else {
        reject('No VR devices');
      }
    })
  };

  
  const launchFs = (element, opts) => {
    if (element.requestFullscreen) {
      element.requestFullscreen(opts);
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen(opts);
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(opts);
    }
  };

  const keyDownHandler = (e) => {
    let key = String.fromCharCode(e.which);
    switch(key) {
      case 'V': // enter VR mode
        launchFs(fsContainer, {
          vrDisplay: vrDevices.headset
        });
        break;

      case 'Z':
        vrDevices.position.resetSensor();
        break;
    }
  }

  window.addEventListener('keydown', keyDownHandler);

  const tick = () => {
    if (vrDevices) {
      let state = vrDevices.position.getState();

      if (state.orientation !== null) {
        oq = new THREE.Quaternion().set(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w);
      }

      if (state.position !== null) {
        pq = new THREE.Quaternion().set(state.position.x, state.position.y, state.position.z, state.position.w);
      }

      if (pq) {
        position = pq.copy(oq);
      } else {
        position = oq;
      }
      
      cssOrientationMatrix = utils.cssMatrixFromOrientation(position, true);

      rightEyeCamera.style.transform = cssOrientationMatrix;
      leftEyeCamera.style.transform = cssOrientationMatrix;
    }

    requestAnimationFrame(tick);
  };

  const start = () => {
    getVrDevices().then(devices => {
      vrDevices = devices;

      requestAnimationFrame(tick);
    })
  };



  start();
};
