import Capacitor
import UserNotifications

@objc(PrayerAlertsPlugin)
class PrayerAlertsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PrayerAlertsPlugin"
    let jsName = "PrayerAlerts"
    let pluginMethods: [CAPPluginMethod] = [.init(name: "schedule", returnType: CAPPluginReturnPromise)]

    @objc func schedule(_ call: CAPPluginCall) {
        guard let notifications = call.getArray("notifications", JSObject.self) else {
            call.reject("Missing prayer notifications")
            return
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        var requests: [UNNotificationRequest] = []

        for notification in notifications {
            guard let id = notification["id"] as? Int,
                  (100...144).contains(id) || id == 999,
                  let milliseconds = notification["at"] as? Double, milliseconds.isFinite,
                  let title = notification["title"] as? String,
                  let body = notification["body"] as? String else {
                call.reject("Invalid prayer notification")
                return
            }
            let at = Date(timeIntervalSince1970: milliseconds / 1000)
            guard at > Date() else { continue }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = body
            content.categoryIdentifier = "PRAYER_ALERT"
            let sound = notification["sound"] as? String ?? ""
            if sound == "adhan.caf" {
                content.sound = UNNotificationSound(named: UNNotificationSoundName(sound))
            }
            // Match the metadata read by Capacitor Local Notifications.
            content.userInfo = [
                "cap_extra": ["prayer": notification["prayer"] as? String ?? "", "adhanSound": sound],
                "cap_schedule": ["at": at]
            ]
            let components = calendar.dateComponents([.calendar, .timeZone, .year, .month, .day, .hour, .minute, .second], from: at)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            requests.append(UNNotificationRequest(identifier: String(id), content: content, trigger: trigger))
        }

        Task {
            do {
                let center = UNUserNotificationCenter.current()
                for request in requests {
                    try await center.add(request)
                }
                call.resolve()
            } catch {
                call.reject("Could not schedule prayer reminders", nil, error)
            }
        }
    }
}
