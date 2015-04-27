(function (THREE) {
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

  // helper function to convert a quaternion into a matrix, optionally
  // inverting the quaternion along the way
  const matrixFromOrientation = (q, inverse) => {
    let m = Array(16);

    let x = q.x, y = q.y, z = q.z, w = q.w;

    // if inverse is given, invert the quaternion first
    if (inverse) {
      x = x; y = -y; z = z;
      let l = Math.sqrt(x*x + y*y + z*z + w*w);
      if (l == 0) {
        x = y = z = 0;
        w = 1;
      } else {
        l = 1/l;
        x *= l; y *= l; z *= l; w *= l;
      }
    }

    let x2 = x + x, y2 = y + y, z2 = z + z;
    let xx = x * x2, xy = x * y2, xz = x * z2;
    let yy = y * y2, yz = y * z2, zz = z * z2;
    let wx = w * x2, wy = w * y2, wz = w * z2;

    m[0] = 1 - (yy + zz);
    m[4] = xy - wz;
    m[8] = xz + wy;

    m[1] = xy + wz;
    m[5] = 1 - (xx + zz);
    m[9] = yz - wx;

    m[2] = xz - wy;
    m[6] = yz + wx;
    m[10] = 1 - (xx + yy);

    m[3] = m[7] = m[11] = 0;
    m[12] = m[13] = m[14] = 0;
    m[15] = 1;

    return m;
  }

  const cssMatrixFromElements = (e) => {
    return "matrix3d(" + e.join(",") + ")";
  };

  const cssMatrixFromOrientation = (q, inverse) => {
    return cssMatrixFromElements(matrixFromOrientation(q, inverse));
  };

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
      
      cssOrientationMatrix = cssMatrixFromOrientation(position, true);

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

})(window.THREE);