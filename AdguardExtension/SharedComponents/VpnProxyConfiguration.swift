import Foundation

/// User-configurable VPN/Proxy settings
struct VpnProxyConfiguration {
    var enabled: Bool
    var host: String
    var port: Int
    var vpnHost: String
    var vpnPort: Int

    static var `default`: VpnProxyConfiguration {
        VpnProxyConfiguration(enabled: false, host: "", port: 0, vpnHost: "127.0.0.1", vpnPort: 0)
    }
}
