import Capacitor
import CoreLocation
import CoreMotion
import UIKit

class AppBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(QiblaCompassPlugin())
        bridge?.registerPluginInstance(PrayerAlertsPlugin())
    }
}

@objc(QiblaCompassPlugin)
class QiblaCompassPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    let identifier = "QiblaCompassPlugin"
    let jsName = "QiblaCompass"
    let pluginMethods: [CAPPluginMethod] = [
        .init(name: "start", returnType: CAPPluginReturnPromise),
        .init(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private var manager: CLLocationManager?
    private let motion = CMMotionManager()

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.stopUpdates()
            guard CLLocationManager.headingAvailable() else {
                call.resolve(["available": false])
                return
            }

            let manager = CLLocationManager()
            self.manager = manager
            manager.delegate = self
            manager.headingFilter = kCLHeadingFilterNone
            manager.desiredAccuracy = kCLLocationAccuracyKilometer
            manager.distanceFilter = 500
            self.updateHeadingOrientation(manager)
            if self.motion.isAccelerometerAvailable {
                self.motion.accelerometerUpdateInterval = 1.0 / 30
                self.motion.startAccelerometerUpdates()
            }
            manager.startUpdatingHeading()
            if manager.authorizationStatus == .notDetermined {
                manager.requestWhenInUseAuthorization()
            }
            self.locationManagerDidChangeAuthorization(manager)
            call.resolve(["available": true])
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.stopUpdates()
            call.resolve()
        }
    }

    private func stopUpdates() {
        manager?.stopUpdatingHeading()
        manager?.stopUpdatingLocation()
        manager?.delegate = nil
        manager = nil
        motion.stopAccelerometerUpdates()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard manager === self.manager else { return }
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            // Core Location needs location updates to correct magnetic north to true north.
            manager.startUpdatingLocation()
        default:
            manager.stopUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading heading: CLHeading) {
        guard manager === self.manager, heading.headingAccuracy >= 0 else { return }
        if updateHeadingOrientation(manager) { return }
        let trueNorth = heading.trueHeading >= 0
        let degrees = trueNorth ? heading.trueHeading : heading.magneticHeading
        guard degrees.isFinite, degrees >= 0 else { return }
        let level = motion.accelerometerData.map { $0.acceleration.z < -0.65 } ?? true
        notifyListeners("heading", data: [
            "heading": degrees,
            "level": level,
            "calibrated": heading.headingAccuracy <= 25,
            "trueNorth": trueNorth
        ])
    }

    @discardableResult
    private func updateHeadingOrientation(_ manager: CLLocationManager) -> Bool {
        let orientation: CLDeviceOrientation
        switch bridge?.viewController?.view.window?.windowScene?.interfaceOrientation {
        case .landscapeLeft: orientation = .landscapeRight
        case .landscapeRight: orientation = .landscapeLeft
        case .portraitUpsideDown: orientation = .portraitUpsideDown
        default: orientation = .portrait
        }
        guard manager.headingOrientation != orientation else { return false }
        manager.headingOrientation = orientation
        return true
    }
}
