'use strict';

(function (THREE) {
  'use strict';

  var vrDevices = undefined;
  var rightEyeCamera = document.getElementById('camera-left');
  var leftEyeCamera = document.getElementById('camera-right');
  var fsContainer = document.getElementById('view');
  var content = document.getElementById('content');

  var position = undefined,
      oq = undefined,
      pq = undefined,
      cssOrientationMatrix = undefined;

  var resize = function resize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
  };

  window.addEventListener('resize', resize, false);
  resize();

  // helper function to convert a quaternion into a matrix, optionally
  // inverting the quaternion along the way
  var matrixFromOrientation = function matrixFromOrientation(q, inverse) {
    var m = Array(16);

    var x = q.x,
        y = q.y,
        z = q.z,
        w = q.w;

    // if inverse is given, invert the quaternion first
    if (inverse) {
      x = x;y = -y;z = z;
      var l = Math.sqrt(x * x + y * y + z * z + w * w);
      if (l == 0) {
        x = y = z = 0;
        w = 1;
      } else {
        l = 1 / l;
        x *= l;y *= l;z *= l;w *= l;
      }
    }

    var x2 = x + x,
        y2 = y + y,
        z2 = z + z;
    var xx = x * x2,
        xy = x * y2,
        xz = x * z2;
    var yy = y * y2,
        yz = y * z2,
        zz = z * z2;
    var wx = w * x2,
        wy = w * y2,
        wz = w * z2;

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
  };

  var cssMatrixFromElements = function cssMatrixFromElements(e) {
    return 'matrix3d(' + e.join(',') + ')';
  };

  var cssMatrixFromOrientation = function cssMatrixFromOrientation(q, inverse) {
    return cssMatrixFromElements(matrixFromOrientation(q, inverse));
  };

  var filterInvalidDevices = function filterInvalidDevices(devices) {
    // Exclude Cardboard position sensor if Oculus exists.
    var oculusDevices = devices.filter(function (device) {
      return device.deviceName.toLowerCase().indexOf('oculus') !== -1;
    });

    if (oculusDevices.length >= 1) {
      return devices.filter(function (device) {
        return device.deviceName.toLowerCase().indexOf('cardboard') === -1;
      });
    } else {
      return devices;
    }
  };

  var vrDeviceCallback = function vrDeviceCallback(devices) {
    devices = filterInvalidDevices(devices);

    var headset = undefined;
    var position = undefined;

    for (var i = 0; i < devices.length; i++) {
      var device = devices[i];
      if (device instanceof HMDVRDevice) {
        headset = device;
      }
      if (device instanceof PositionSensorVRDevice) {
        position = device;
      }
      if (position && headset) {
        return {
          headset: headset,
          position: position
        };
      }
    };

    return false;
  };

  var getVrDevices = function getVrDevices() {
    return new Promise(function (resolve, reject) {
      if (navigator.getVRDevices) {
        navigator.getVRDevices().then(function (devices) {
          resolve(vrDeviceCallback(devices));
        });
      } else {
        reject('No VR devices');
      }
    });
  };

  var launchFs = function launchFs(element, opts) {
    if (element.requestFullscreen) {
      element.requestFullscreen(opts);
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen(opts);
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(opts);
    }
  };

  var keyDownHandler = function keyDownHandler(e) {
    var key = String.fromCharCode(e.which);
    switch (key) {
      case 'V':
        // enter VR mode
        launchFs(fsContainer, {
          vrDisplay: vrDevices.headset
        });
        break;

      case 'Z':
        vrDevices.position.resetSensor();
        break;
    }
  };

  window.addEventListener('keydown', keyDownHandler);

  var tick = (function (_tick) {
    function tick() {
      return _tick.apply(this, arguments);
    }

    tick.toString = function () {
      return _tick.toString();
    };

    return tick;
  })(function () {
    if (vrDevices) {
      var state = vrDevices.position.getState();

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
  });

  var start = function start() {
    getVrDevices().then(function (devices) {
      vrDevices = devices;

      requestAnimationFrame(tick);
    });
  };

  start();
})(window.THREE);
