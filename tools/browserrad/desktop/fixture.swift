import AppKit
import Foundation

final class Fixture: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var button: NSButton!
    let receipt: URL
    let token: String

    init(receipt: URL, token: String) {
        self.receipt = receipt
        self.token = token
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 100, y: 100, width: 420, height: 160),
                          styleMask: [.titled, .closable], backing: .buffered, defer: false)
        window.title = "RAD desktop fixture"
        let label = NSTextField(labelWithString: "Synthetic receipt only — no account or browser data")
        label.frame = NSRect(x: 20, y: 100, width: 390, height: 30)
        button = NSButton(title: "Create synthetic receipt", target: self, action: #selector(createReceipt))
        button.frame = NSRect(x: 80, y: 35, width: 260, height: 40)
        button.setAccessibilityIdentifier("rad-create-receipt")
        window.contentView?.addSubview(label)
        window.contentView?.addSubview(button)
        window.center()
        window.makeKeyAndOrderFront(nil)
    }

    @objc func createReceipt() {
        do {
            try Data((token + "\n").utf8).write(to: receipt, options: .withoutOverwriting)
            button.title = "Receipt created"
            button.isEnabled = false
        } catch {
            button.title = "Receipt write failed"
            button.isEnabled = false
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

let arguments = CommandLine.arguments
if arguments.count != 3 || !arguments[2].hasPrefix("RAD-DESKTOP-") { exit(2) }
let app = NSApplication.shared
let fixture = Fixture(receipt: URL(fileURLWithPath: arguments[1]), token: arguments[2])
app.setActivationPolicy(.regular)
app.delegate = fixture
app.run()
