/**
 * Created by johanbehrens on 2018/05/09.
 */


var buf = Buffer.alloc(256);

// val = (uint32_t)buf[3] | ((uint32_t)buf[4] << 8) | ((uint32_t)dPtr[2] << 16) | ((uint32_t)dPtr[3] << 24);



var val = '1234567734567';

var x = Buffer.from(val,'hex'); //var a = parseInt("10")

var toCopyBuffer = Buffer.alloc(4);
x.copy(toCopyBuffer, 0);
x = Buffer.from(toCopyBuffer.toString('hex').match(/.{2}/g).reverse().join(""),'hex');

const size = x.length;
buf[0] = 0x5a;
buf[1] = 1;
buf[2] = size;

x.copy(buf, 3);

console.log(buf);