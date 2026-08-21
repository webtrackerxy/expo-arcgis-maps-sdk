package expo.modules.arcgismapssdk

import com.arcgismaps.httpcore.authentication.NetworkAuthenticationChallenge
import com.arcgismaps.httpcore.authentication.NetworkAuthenticationChallengeHandler
import com.arcgismaps.httpcore.authentication.NetworkAuthenticationChallengeResponse
import com.arcgismaps.httpcore.authentication.NetworkCredential

/**
 * A [NetworkAuthenticationChallengeHandler] that answers challenges from a single
 * host with a fixed credential (used for IWA / PKI sign-in). Challenges from any
 * other host are cancelled, so installing it does not hijack unrelated hosts.
 */
class SingleHostNetworkChallengeHandler(
  private val hostname: String,
  private val credential: NetworkCredential,
) : NetworkAuthenticationChallengeHandler {
  override suspend fun handleNetworkAuthenticationChallenge(
    challenge: NetworkAuthenticationChallenge
  ): NetworkAuthenticationChallengeResponse =
    if (challenge.hostname == hostname) {
      NetworkAuthenticationChallengeResponse.ContinueWithCredential(credential)
    } else {
      NetworkAuthenticationChallengeResponse.Cancel
    }
}
