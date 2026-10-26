import SwiftUI
import AVFoundation

@main
struct SGAudioTestApp: App {
    var body: some Scene { WindowGroup { ContentView() } }
}

@MainActor
final class Monitor: ObservableObject {
    @Published var running = false
    @Published var status = "Connect TONEX by USB and use its wired headphones."
    @Published var details = ""
    @Published var frames = 128
    @Published var level: Float = -24 {
        didSet { engine?.mainMixerNode.outputVolume = powf(10, level / 20) }
    }
    private var engine: AVAudioEngine?
    private var observers: [NSObjectProtocol] = []
    private var starting = false

    init() {
        for name in [AVAudioSession.routeChangeNotification, AVAudioSession.interruptionNotification,
                     AVAudioSession.mediaServicesWereResetNotification] {
            observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                Task { @MainActor in
                    guard let self, self.running else { return }
                    self.stop()
                    self.status = "Audio route changed or interrupted. Check USB, then press Start."
                }
            })
        }
    }

    func start() {
        guard !starting, !running else { return }
        starting = true
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                guard let self else { return }
                defer { self.starting = false }
                guard granted else { self.status = "Allow microphone access in iPad Settings."; return }
                self.open()
            }
        }
    }

    private func open() {
        let session = AVAudioSession.sharedInstance()
        do {
            // Measurement mode avoids voice processing. No Bluetooth or speaker override.
            try session.setCategory(.playAndRecord, mode: .measurement, options: [])
            guard let usb = session.availableInputs?.first(where: { $0.portType == .usbAudio }) else {
                throw Failure.message("USB input not found. Connect TONEX and try again.")
            }
            try session.setPreferredInput(usb)
            // Match TONEX Plug's USB rate. Hardware preferences are requests, not guarantees.
            try session.setPreferredSampleRate(44_100)
            try session.setPreferredIOBufferDuration(Double(frames) / 44_100)
            try session.setActive(true)
            guard session.currentRoute.inputs.contains(where: { $0.portType == .usbAudio }),
                  session.currentRoute.outputs.contains(where: { $0.portType == .usbAudio }) else {
                throw Failure.message("USB input AND output required. Check TONEX and headphones.")
            }
            let audio = AVAudioEngine()
            let input = audio.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.channelCount > 0, format.sampleRate > 0 else {
                throw Failure.message("USB audio format unavailable.")
            }
            // Direct native graph, no taps, worklets, networking, effects or PCM bridge.
            audio.connect(input, to: audio.mainMixerNode, format: format)
            audio.mainMixerNode.outputVolume = powf(10, level / 20)
            audio.prepare()
            try audio.start()
            engine = audio
            running = true
            status = "Native USB monitoring"
            let route = session.currentRoute
            details = "Input: \(route.inputs.map(\.portName).joined(separator: ", "))\nOutput: \(route.outputs.map(\.portName).joined(separator: ", "))\nRate: \(Int(session.sampleRate)) Hz · \(format.channelCount) input channels\nActual I/O buffer: \(String(format: "%.2f", session.ioBufferDuration * 1000)) ms\nReported input: \(String(format: "%.2f", session.inputLatency * 1000)) ms\nReported output: \(String(format: "%.2f", session.outputLatency * 1000)) ms\nThese are system values, not measured round-trip latency."
        } catch {
            stop()
            status = error.localizedDescription
        }
    }

    func stop() {
        engine?.mainMixerNode.outputVolume = 0
        engine?.stop()
        engine = nil
        running = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    enum Failure: LocalizedError {
        case message(String)
        var errorDescription: String? { if case let .message(text) = self { return text }; return nil }
    }
}

struct ContentView: View {
    @StateObject private var monitor = Monitor()
    @Environment(\.scenePhase) private var phase
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("SG / AUDIO TEST").font(.title.bold()).foregroundColor(.purple)
            Text(monitor.status).font(.headline)
            Picker("Requested buffer", selection: $monitor.frames) {
                ForEach([64, 128, 256], id: \.self) { Text("\($0) frames").tag($0) }
            }.pickerStyle(.segmented).disabled(monitor.running)
            Text("Output \(Int(monitor.level)) dB")
            Slider(value: $monitor.level, in: -60 ... 0)
            Button(monitor.running ? "Stop" : "Start") {
                if monitor.running { monitor.stop() } else { monitor.start() }
            }.buttonStyle(.borderedProminent).tint(.purple).controlSize(.large)
            Text(monitor.details).font(.system(.footnote, design: .monospaced))
            Spacer()
            Text("No amp or effects. This monitors the signal provided by TONEX. Start with low headphone volume; hardware direct monitoring can also be audible.")
                .font(.footnote).foregroundColor(.secondary)
        }
        .padding(28).preferredColorScheme(.dark)
        .onChange(of: phase) { value in if value != .active { monitor.stop() } }
    }
}
