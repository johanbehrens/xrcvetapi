var printer = require("node-thermal-printer");
printer.init({
    type: 'epson',
    interface: '/dev/usb/lp0'
});

printer.code128("Code128", {
    width: "LARGE",          // "SMALL", "MEDIUM", "LARGE",
    height: 80,              // 50 < x < 80
    text: 2,                 // 1 - No text
                             // 2 - Text on bottom
                             // 3 - No text inline
                             // 4 - Text on bottom inline
});

printer.printQR("QR Code", {
    cellSize: 3,             // 1 - 8
    correction: 'M',         // L(7%), M(15%), Q(25%), H(30%)
    model: 2,                // 1 - Model 1
                             // 2 - Model 2 (standard)
                             // 3 - Micro QR
});

printer.pdf417("PDF417", {
    rowHeight: 3,            // 2 - 8
    width: 3,                // 2 - 8
    correction: 1,           // Ratio: 1 - 40
    truncated: false,        // boolean
    columns: 0               // 1 - 30, 0 auto
});

printer.maxiCode("MaxiCode", {
    mode: 4,                 // 2 - Formatted/structured Carrier Message (US)
                             // 3 - Formatted/structured Carrier Message (International)
                             // 4 - Unformatted data with Standard Error Correction.
                             // 5 - Unformatted data with Enhanced Error Correction.
                             // 6 - For programming hardware devices.
});

var data = "GS1-128"     // Barcode data (string or buffer)
var type = 74            // Barcode type (See Reference)
var settings = {         // Optional Settings
    hriPos: 0,             // Human readable character 0 - 3 (none, top, bottom, both)
    hriFont: 0,            // Human readable character font
    width: 3,              // Barcode width
    height: 168            // Barcode height
}

printer.printBarcode(data, type, settings);