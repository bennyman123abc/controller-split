const HID = require("node-hid");
const { vJoyDevice } = require("vjoy");
const bitwise = require("bitwise");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./vJoyConfig.json"));
const devices = config.devices.map((device) => device.enabled ? new HID.HID(device.vid, device.pid) : null);
const vDevice = vJoyDevice.create(1);

devices.forEach((_, id) => {
    console.log(`Device ${id} Connected`);
});

function pollInput(id, data) {
    let device = config.devices[id];
    let stickLeftX = data[2];
    let stickLeftY = data[3];
    let stickRightX = data[4];
    let stickRightY = data[5];
    let triggerLeft = data[6];
    let triggerRight = data[7];

    let slxd = [
        device.stickOrigins.slx + config.stickDeadZone,
        device.stickOrigins.slx - config.stickDeadZone
    ];
    let slyd = [
        device.stickOrigins.sly + config.stickDeadZone,
        device.stickOrigins.sly - config.stickDeadZone
    ];
    let srxd = [
        device.stickOrigins.srx + config.stickDeadZone,
        device.stickOrigins.srx - config.stickDeadZone
    ];
    let sryd = [
        device.stickOrigins.sry + config.stickDeadZone,
        device.stickOrigins.sry - config.stickDeadZone
    ];

    if (stickLeftX < slxd[0] && stickLeftX > slxd[1]) stickLeftX = device.stickOrigins.slx;
    if (stickLeftY < slyd[0] && stickLeftY > slyd[1]) stickLeftY = device.stickOrigins.sly;
    if (stickRightX < srxd[0] && stickRightX > srxd[1]) stickRightX = device.stickOrigins.srx;
    if (stickRightY < sryd[0] && stickRightY > sryd[1]) stickRightY = device.stickOrigins.sry;
    
    let triangle = data[0] & 128;
    let circle = data[0] & 64;
    let cross = data[0] & 32;
    let square = data[0] & 16;

    let dInt = parseInt(bitwise.byte.read(data[0]).splice(4, 4).join(""), 2);
    let dUp = dInt == 0;
    let dUpRight = dInt == 1;
    let dUpLeft = dInt == 7;
    let dDown = dInt == 4;
    let dDownRight = dInt == 3;
    let dDownLeft = dInt == 5;
    let dLeft = dInt == 6;
    let dRight = dInt == 2;

    let bLeft = data[1] & 1;
    let bRight = data[1] & 2;
    let tLeft = data[1] & 4;
    let tRight = data[1] & 8;

    let select = data[1] & 16;
    let start = data[1] & 32;
    let thumbLeft = data[1] & 64;
    let thumbRight = data[1] & 128;

    if (config.triangle == id) vDevice.buttons[1].set(triangle);
    if (config.circle == id) vDevice.buttons[2].set(circle);
    if (config.cross == id) vDevice.buttons[3].set(cross);
    if (config.square == id) vDevice.buttons[4].set(square);

    if (config.dpad.up == id) vDevice.buttons[5].set(dUp || dUpLeft || dUpRight);
    if (config.dpad.right == id) vDevice.buttons[6].set(dRight || dUpRight || dDownRight);
    if (config.dpad.down == id) vDevice.buttons[7].set(dDown || dDownLeft || dDownRight);
    if (config.dpad.left == id) vDevice.buttons[8].set(dLeft || dUpLeft || dDownLeft);

    if (config.bumper.left == id) vDevice.buttons[9].set(bLeft);
    if (config.bumper.right == id) vDevice.buttons[10].set(bRight);
    if (config.leftTrigger == id) vDevice.buttons[11].set(tLeft);
    if (config.rightTrigger == id) vDevice.buttons[12].set(tRight);

    if (config.select == id) vDevice.buttons[13].set(select);
    if (config.start == id) vDevice.buttons[14].set(start);
    if (config.leftStick.button == id) vDevice.buttons[15].set(thumbLeft);
    if (config.rightStick.button == id) vDevice.buttons[16].set(thumbRight);

    if (config.leftStick.x == id) vDevice.axes.X.set(stickLeftX * 128 + 1);
    if (config.leftStick.y == id) vDevice.axes.Y.set(stickLeftY * 128 + 1);
    if (config.rightStick.x == id) vDevice.axes.Rx.set(stickRightX * 128 + 1);
    if (config.rightStick.y == id) vDevice.axes.Ry.set(stickRightY * 128 + 1);
    
    return;
}

function pollDevices() {
    devices.forEach((device, id) => {
        try {
            var data = device.readSync();
            let dp = config.devices[id].dataPins;
            pollInput(id, [data[dp[0]], data[dp[1]], data[dp[2]], data[dp[3]], data[dp[4]], data[dp[5]], data[dp[6]], data[11]]);
        } catch(err) {
            return console.log(err);
        }

    });
    return;
}

setInterval(pollDevices);