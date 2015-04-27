
// helper function to convert a quaternion into a matrix, optionally
// inverting the quaternion along the way
let matrixFromOrientation = exports.matrixFromOrientation = (q, inverse) => {
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

let cssMatrixFromElements = exports.cssMatrixFromElements = (e) => {
  return "matrix3d(" + e.join(",") + ")";
};

exports.cssMatrixFromOrientation = (q, inverse) => {
  return cssMatrixFromElements(matrixFromOrientation(q, inverse));
};