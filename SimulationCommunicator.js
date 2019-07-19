const WebSocket = require('ws')

class SimulatorRequest {
    constructor(id, data, resolve, reject) {
        this.req_id = id
        this.data = data
        this.resolve = resolve
        this.reject = reject
    }

    res(data) {
        this.resolve(data);
    }

    rej(err) {
        this.reject(err);
    }

    JSON() {
        return JSON.stringify(
            {req_id: this.req_id,
            data: this.data}
        )
    }
}

class SimulationCommunicator {
    constructor() {
        this.requests = []
        this.count = 0
        this.ws = null
        this.time = 12
        this.date = 8
    }

    isConnected() {
        return this.ws != null
    }

    setWs(ws) {
        ws.on("message", (message) => {
            console.log("Received: " + message)
            let msg = JSON.parse(message)
            let req = this.requests.find(req => req.req_id == msg.req_id)
            this.requests = this.requests.filter(req => req.req_id == msg.req_id)
            req.res(msg.data)
        })
        ws.on('close', (close) => {
            console.log("Socket closed!: " + close)
            this.ws = null
        })
        this.ws = ws;
    }

    sendDeviceStatus(deviceid, status) {
        return new Promise((resolve, reject) => {
            let msg = {type: "setDeviceStatus", device:deviceid, status: status}
            let request = new SimulatorRequest(++this.count, msg, resolve, reject)
            this.requests.push(request)
            this.ws.send(request.JSON())
        })
    }

}

module.exports = new SimulationCommunicator();