export function photoSwipe({x,y,endX,endY,multiTouch=false,scale=1}) {
  const dx=endX-x,dy=endY-y;
  if(multiTouch||scale>1||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.5)return 0;
  return dx<0?1:-1;
}
