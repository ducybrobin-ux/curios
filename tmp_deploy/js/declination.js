/* =========================================================
   Curi🧭s — Déclinaison magnétique (nord vrai)
   Implémentation du World Magnetic Model 2025 (WMM2025,
   valable 2025-2030, NOAA / NCEI), adaptée de la lib
   « magvar » (MIT) de Darren Yeates (github.com/dpyeates/magvar).

   Usage :
     const d = GeoMag.declination(lat, lng);          // altitude 0 km
     const d = GeoMag.declination(lat, lng, altKm);   // en kilomètres
     const d = GeoMag.calculate(julianDays, lat, lng, altKm); // date arbitraire

   Résultat : déclinaison en degrés, positive vers l'Est.
   Pour afficher le NORD VRAI : capVrai = (capMagnétique + d) mod 360.
   ========================================================= */

(function () {
  "use strict";

  const DEG_TO_RAD = 0.017453292519943295;
  const RAD_TO_DEG = 57.29577951308232;

  function deg2rad(d) { return d * DEG_TO_RAD; }
  function rad2deg(r) { return r * RAD_TO_DEG; }

  function zeroArray2D(rows, cols) {
    const a = new Array(rows);
    for (let i = 0; i < rows; i++) { a[i] = new Array(cols).fill(0); }
    return a;
  }

  /* WMM2025 — coefficients (g/h) et variation séculaire (gt/ht), n=1..12 */
  const gnmWmm = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-29351.8, -1410.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-2556.6, 2951.1, 1649.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1361.0, -2404.1, 1243.8, 453.6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [895.0, 799.5, 55.7, -281.1, 12.1, 0, 0, 0, 0, 0, 0, 0, 0],
    [-233.2, 368.9, 187.2, -138.7, -142.0, 20.9, 0, 0, 0, 0, 0, 0, 0],
    [64.4, 63.8, 76.9, -115.7, -40.9, 14.9, -60.7, 0, 0, 0, 0, 0, 0],
    [79.5, -77.0, -8.8, 59.3, 15.8, 2.5, -11.1, 14.2, 0, 0, 0, 0, 0],
    [23.2, 10.8, -17.5, 2.0, -21.7, 16.9, 15.0, -16.8, 0.9, 0, 0, 0, 0],
    [4.6, 7.8, 3.0, -0.2, -2.5, -13.1, 2.4, 8.6, -8.7, -12.9, 0, 0, 0],
    [-1.3, -6.4, 0.2, 2.0, -1.0, -0.6, -0.9, 1.5, 0.9, -2.7, -3.9, 0, 0],
    [2.9, -1.5, -2.5, 2.4, -0.6, -0.1, -0.6, -0.1, 1.1, -1.0, -0.2, 2.6, 0],
    [-2.0, -0.2, 0.3, 1.2, -1.3, 0.6, 0.6, 0.5, -0.1, -0.4, -0.2, -1.3, -0.7]
  ];

  const hnmWmm = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 4545.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -3133.6, -815.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -56.6, 237.5, -549.5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 278.6, -133.9, 212.0, -375.6, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 45.4, 220.2, -122.9, 43.0, 106.1, 0, 0, 0, 0, 0, 0, 0],
    [0, -18.4, 16.8, 48.8, -59.8, 10.9, 72.7, 0, 0, 0, 0, 0, 0],
    [0, -48.9, -14.4, -1.0, 23.4, -7.4, -25.1, -2.3, 0, 0, 0, 0, 0],
    [0, 7.1, -12.6, 11.4, -9.7, 12.7, 0.7, -5.2, 3.9, 0, 0, 0, 0],
    [0, -24.8, 12.2, 8.3, -3.3, -5.2, 7.2, -0.6, 0.8, 10.0, 0, 0, 0],
    [0, 3.3, 0.0, 2.4, 5.3, -9.1, 0.4, -4.2, -3.8, 0.9, -9.1, 0, 0],
    [0, 0, 2.9, -0.6, 0.2, 0.5, -0.3, -1.2, -1.7, -2.9, -1.8, -2.3, 0],
    [0, -1.3, 0.7, 1.0, -1.4, 0.0, 0.6, -0.1, 0.8, 0.1, -1.0, 0.1, 0.2]
  ];

  const gtnmWmm = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [12.0, 9.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-11.6, -5.2, -8.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-1.3, -4.2, 0.4, -15.6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-1.6, -2.4, -6.0, 5.6, -7.0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0.6, 1.4, 0.0, 0.6, 2.2, 0.9, 0, 0, 0, 0, 0, 0, 0],
    [-0.2, -0.4, 0.9, 1.2, -0.9, 0.3, 0.9, 0, 0, 0, 0, 0, 0],
    [-0, -0.1, -0.1, 0.5, -0.1, -0.8, -0.8, 0.8, 0, 0, 0, 0, 0],
    [-0.1, 0.2, 0.0, 0.5, -0.1, 0.3, 0.2, -0, 0.2, 0, 0, 0, 0],
    [-0, -0.1, 0.1, 0.3, -0.3, 0, 0.3, -0.1, 0.1, -0.1, 0, 0, 0],
    [0.1, 0.0, 0.1, 0.1, -0, -0.3, 0, -0.1, -0.1, -0, -0, 0, 0],
    [0, -0, 0, 0, 0, -0.1, 0, -0, -0.1, -0.1, -0.1, -0.1, 0],
    [0, 0, -0, -0, -0, -0, 0.1, -0, 0, 0, -0.1, -0, -0.1]
  ];

  const htnmWmm = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -21.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -27.7, -12.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 4.0, -0.3, -4.1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -1.1, 4.1, 1.6, -4.4, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -0.5, 2.2, 0.4, 1.7, 1.9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0.3, -1.6, -0.4, 0.9, 0.7, 0.9, 0, 0, 0, 0, 0, 0],
    [0, 0.6, 0.5, -0.8, 0.0, -1.0, 0.6, -0.2, 0, 0, 0, 0, 0],
    [0, -0.2, 0.5, -0.4, 0.4, -0.5, -0.6, 0.3, 0.2, 0, 0, 0, 0],
    [0, -0.3, 0.3, -0.3, 0.3, 0.2, -0.1, -0.2, 0.4, 0.1, 0, 0, 0],
    [0, 0, -0, -0.2, 0.1, -0.1, 0.1, 0.0, -0.1, 0.2, -0, 0, 0],
    [0, -0, 0.1, -0, 0.1, -0, -0, 0.1, -0, 0, 0, 0, 0],
    [0, -0, 0, -0.1, 0.1, -0, -0, -0, 0, -0, -0, 0, -0.1]
  ];

  const julianDaysCOF = 2460677;

  const globe = {
    a: 6378.137,
    b: 6356.7523142,
    r0: 6371.2
  };

  const P = zeroArray2D(13, 13);
  const DP = zeroArray2D(13, 13);
  const gnm = zeroArray2D(13, 13);
  const hnm = zeroArray2D(13, 13);
  const sm = new Float32Array(13);
  const cm = new Float32Array(13);
  const root = new Float32Array(13);
  const roots = zeroArray2D(13, 13).map(function (row) {
    return row.map(function () { return new Float32Array(2); });
  });

  for (var n = 2; n <= 12; n++) {
    root[n] = Math.sqrt((2.0 * n - 1) / (2.0 * n));
  }
  for (let m = 0; m <= 12; m++) {
    const mm = m * m;
    for (var n = Math.max(m + 1, 2); n <= 12; n++) {
      roots[m][n][0] = Math.sqrt((n - 1) * (n - 1) - mm);
      roots[m][n][1] = 1.0 / Math.sqrt(n * n - mm);
    }
  }

  function calculate(julianDays, latitude, longitude, altitude) {
    altitude = altitude || 0;
    const latRad = deg2rad(latitude);
    const lonRad = deg2rad(longitude);
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const sr = Math.sqrt(globe.a * globe.a * cosLat * cosLat + globe.b * globe.b * sinLat * sinLat);
    const theta = Math.atan2(cosLat * (altitude * sr + globe.a * globe.a), sinLat * (altitude * sr + globe.b * globe.b));
    const r = Math.sqrt(
      altitude * altitude +
      2 * altitude * sr +
      (globe.a ** 4 - (globe.a ** 4 - globe.b ** 4) * sinLat * sinLat) /
      (globe.a ** 2 - (globe.a ** 2 - globe.b ** 2) * sinLat * sinLat)
    );
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const invS = 1 / (s + (s === 0 ? 1e-8 : 0));

    P[0][0] = 1.0;
    P[1][1] = s;
    DP[0][0] = 0.0;
    DP[1][1] = c;
    P[1][0] = c;
    DP[1][0] = -s;

    for (let n2 = 2; n2 <= 12; n2++) {
      P[n2][n2] = P[n2 - 1][n2 - 1] * s * root[n2];
      DP[n2][n2] = (DP[n2 - 1][n2 - 1] * s + P[n2 - 1][n2 - 1] * c) * root[n2];
    }

    for (let m2 = 0; m2 <= 12; m2++) {
      for (let n3 = Math.max(m2 + 1, 2); n3 <= 12; n3++) {
        P[n3][m2] = (P[n3 - 1][m2] * c * (2 * n3 - 1) - P[n3 - 2][m2] * roots[m2][n3][0]) * roots[m2][n3][1];
        DP[n3][m2] = ((DP[n3 - 1][m2] * c - P[n3 - 1][m2] * s) * (2 * n3 - 1) - DP[n3 - 2][m2] * roots[m2][n3][0]) *
          roots[m2][n3][1];
      }
    }

    const yearFrac = (julianDays - julianDaysCOF) / 365.25;
    for (let n4 = 1; n4 <= 12; n4++) {
      for (let m3 = 0; m3 <= 12; m3++) {
        gnm[n4][m3] = gnmWmm[n4][m3] + yearFrac * gtnmWmm[n4][m3];
        hnm[n4][m3] = hnmWmm[n4][m3] + yearFrac * htnmWmm[n4][m3];
      }
    }

    for (let m4 = 0; m4 <= 12; m4++) {
      sm[m4] = Math.sin(m4 * lonRad);
      cm[m4] = Math.cos(m4 * lonRad);
    }

    let BR = 0.0;
    let BTheta = 0.0;
    let BPhi = 0.0;
    const fn0 = globe.r0 / r;
    let fn = fn0 * fn0;

    for (let n5 = 1; n5 <= 12; n5++) {
      let c1n = 0;
      let c2n = 0;
      let c3n = 0;
      for (let m5 = 0; m5 <= n5; m5++) {
        const tmp = gnm[n5][m5] * cm[m5] + hnm[n5][m5] * sm[m5];
        c1n += tmp * P[n5][m5];
        c2n += tmp * DP[n5][m5];
        c3n += m5 * (gnm[n5][m5] * sm[m5] - hnm[n5][m5] * cm[m5]) * P[n5][m5];
      }
      fn *= fn0;
      BR += (n5 + 1) * c1n * fn;
      BTheta -= c2n * fn;
      BPhi += c3n * fn * invS;
    }

    const psi = theta - (Math.PI / 2 - latRad);
    const sinPsi = Math.sin(psi);
    const cosPsi = Math.cos(psi);
    const X = -BTheta * cosPsi - BR * sinPsi;
    const Y = BPhi;

    return (X !== 0.0 || Y !== 0.0) ? rad2deg(Math.atan2(Y, X)) : 0.0;
  }

  function declination(latitude, longitude, altitude) {
    const now = new Date();
    const julianDays = (now.valueOf() / 86400000) + 2440587.5;
    return calculate(julianDays, latitude, longitude, altitude);
  }

  window.GeoMag = {
    declination: declination,
    calculate: calculate
  };
})();
