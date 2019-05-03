var Verifier = require('google-play-billing-validator')

var options = {
    email: "firebase-adminsdk-18xp6@xrc-tracker-1553667749489.iam.gserviceaccount.com",
    key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDihW6jpz2akKv1\nRi7DvHLSIqXctq7EIq27RWh2w2YG+CSVZ0WwIrppG/Cgd53oINdSkxTC3XZ3SmhX\n0fdhHQpMKy2nz6Z8y/tfHUoKigA74EQY8FuvUZsdGOPIZhDaQcqlEtJJ1L1URAz5\nrToun5whl+iF9DsHeBJyPF7YZ81psFaNLnQEOuFFX5a9+jOxdPKsqTVbTjwBs9vs\nwERVXHf4T/7m4svoVq+n+3coHjQAppx8IEqWoJ/O1bm0aB5X6Q+u0pSv2wnBUVSB\nPcF8h3azMEUewqf+U9f2jB+N/wyiba1+DA1i9CXf1PgFC/idwZLq/Oi5/K3N8OiA\nEVnL/QsBAgMBAAECggEABey3wrnHdZUaXEtSQo4ZojekBzBzhH+ENAFaHL4aW20O\n1uYJN3THE6P2kJnkVEuUmi0s5jZg6HiWn1Jnch+ucuTPuEOI/xteNyQG2Vz36dkB\nKvZRbZXYtON/ZLDPuMeu/0+NVr9E1vEDNl4SpyDHVoUYwLUtPJImSFzeHbKkV6Ln\nnSKhnFiFU+VUTPPWbrPJAbobUzzTxfr0BYQOfdMazI8GtxSkGcO+QmWpI9solQuY\n8gOrTfDVXaxFkrLym9JxYQk3D4+6idu8flLJk9s7GHYQZI88Z+xw3HKAvTxHBp9F\nuJXe9YBdM/deHSOVtDeM7CpzuIwWBfOX/lWb3u9xeQKBgQD1u9j01IpGY5WL6oTL\n7RLU6lyjMFm6AlrxXK5/chEtdOTaiZW95N0hLOeVOYkzAeeQ588lKIoyrHTxQ9/n\nJoZ/lhBhnfKjR6mZuqjXAFWPvSalEvO6oWdPJHwB8kcKFId2wf1cK7QHCaPLdJNS\nqf9CDc1PwECeT8TEFlDcz4j36QKBgQDr/BqiylaKlAfOL625+hQWoDZZB0HLHPC1\neXNF7EvtDbPx//Fr95ZzoiARRcZkHNTjgBA1CgEZOANKyW2RML4Z91P8QWm9I8IS\n/mVJ+KYG5IpFuoG9C0D8NUTAXHyDFSnV53KeHlE1eC+hnUROifbnEzsmzLKo54A2\n3kPO/WojWQKBgQC07jDaY7vEBALSWESa2d2pwz2eMjV+jclkOXeKAvS+4Xi3p+IH\nRYHDsYp6BzkLw3U67lNI6saGdRBNrEopqeYR/u3k0iUbL+KifBtg4rAc+4p+tKuc\nWMb2MMjVrgu8Uk1DlaX0vYD6RZDCdv0aOmzlt7/Z3pY1ekpIjp3PV0dkMQKBgCux\nI6VcXSWPPtq4DSxP1wRRaX6WT2Ix24deEy+xDmW3kceOob5huuNx8wn/pznF9Myi\nW13Wmll2+3UPUk/9fFUGa/BalB9GzZoCq/JELUk9azR50aeUu9V2b2JGPW9vra1D\nCv+nkVWbCQadPZZlCOfDscH/SFzpb924zUk3tj0RAoGBAJuOMD/HtSfvrUk/qLCh\nuYhdcu+j36YwFUfUp/1Yg3pOPZo5x1BKbNv4gDOLKyLjlqEoygeQfKUCaUcnESwX\nAKAeS84+sRiTUo30JDLjeWuBtEUXk0oe45Z7oE4hBuZP70C3qLgMJXghE0CNv1VP\nrSFPWnUY6ruq6A3cbqKRZes1\n-----END PRIVATE KEY-----\n"
}
var verifier = new Verifier(options);
let receipt = {
    packageName: "com.tracker.xrc",
    productId: "basic_monthly",
    purchaseToken: "purchase token"
};
let promiseData = verifier.verifyINAPP(receipt)

promiseData.then(function (response) {
    console.log(response)
})
    .then(function (response) {
        console.log(response)
        // Here for example you can chain your work if purchase is valid
        // eg. add coins to the user profile, etc
        // If you are new to promises API
        // Awesome docs: https://developers.google.com/web/fundamentals/primers/promises
    })
    .catch(function (error) {
        console.log(error)
    })