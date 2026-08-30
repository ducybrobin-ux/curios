/* Auto-généré par tools/build-geo.mjs — NE PAS ÉDITER MANUELLEMENT */
(function(){
window.GeoMath = {};
  function haversine(lat1,lng1,lat2,lng2){var R=6371e3,r=Math.PI/180,dLat=(lat2-lat1)*r,dLng=(lng2-lng1)*r,a=Math.sin(dLat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))};
  function bearing(lat1,lng1,lat2,lng2){var r=Math.PI/180,p1=lat1*r,p2=lat2*r,dl=(lng2-lng1)*r,y=Math.sin(dl)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);return((180*Math.atan2(y,x)/Math.PI)%360+360)%360};
  function normDeg(d){return((((d%360)+360)%360)+180)%360-180};
  var _DIRS=["N","NE","E","SE","S","SO","O","NO"];function cardinal(d){return _DIRS[Math.round((((d%360)+360)%360)/45)%8]};
  window.GeoMath.haversine = haversine;
  window.GeoMath.bearing = bearing;
  window.GeoMath.normDeg = normDeg;
  window.GeoMath.cardinal = cardinal;
})();
