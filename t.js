/**
 * Created by johanbehrens on 2018/05/09.
 */


var buf = Buffer.alloc(256);

// val = (uint32_t)buf[3] | ((uint32_t)buf[4] << 8) | ((uint32_t)dPtr[2] << 16) | ((uint32_t)dPtr[3] << 24);



var val = '123456789';

var toCopyBuffer = Buffer.from(val,'hex'); //var a = parseInt("10")
toCopyBuffer = Buffer.from(toCopyBuffer.toString('hex').match(/.{2}/g).reverse().join(""),'hex');
const size = toCopyBuffer.length;

buf[0] = 0x5a;
buf[1] = 1;
buf[2] = size;

toCopyBuffer.copy(buf, 3);

console.log(buf);