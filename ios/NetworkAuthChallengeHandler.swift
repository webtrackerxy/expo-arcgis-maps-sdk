import ArcGIS
import Foundation

/// A network authentication challenge handler that answers challenges from a
/// single host with a fixed credential (used for IWA / PKI sign-in). Challenges
/// from any other host are passed through without a credential, so installing it
/// does not hijack unrelated hosts.
final class SingleHostNetworkChallengeHandler: NetworkAuthenticationChallengeHandler {
  private let host: String
  private let credential: NetworkCredential

  init(host: String, credential: NetworkCredential) {
    self.host = host
    self.credential = credential
  }

  func handleNetworkAuthenticationChallenge(
    _ challenge: NetworkAuthenticationChallenge
  ) async -> NetworkAuthenticationChallenge.Disposition {
    if challenge.host == host {
      return .continueWithCredential(credential)
    }
    return .continueWithoutCredential
  }
}
