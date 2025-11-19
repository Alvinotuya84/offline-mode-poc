package com.offlinemodepoc.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
        private const val PREFS_NAME = "OfflineModePrefs"
        private const val KEY_PENDING_SMS_ACTION = "pending_sms_action"
        private const val KEY_SMS_TIMESTAMP = "sms_timestamp"

        private const val AUTHORIZED_SENDER = "+254748755840" // Your sender number
        private const val OFFLINE_OTP_PATTERN = "OFFLINE-\\d{6}" // e.g., OFFLINE-123456
        private const val ONLINE_OTP_PATTERN = "ONLINE-\\d{6}" // e.g., ONLINE-123456
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            return
        }

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            for (smsMessage in messages) {
                val sender = smsMessage.displayOriginatingAddress
                val messageBody = smsMessage.messageBody

                Log.d(TAG, "SMS received from: $sender, body: $messageBody")

                // Validate sender
                if (!isAuthorizedSender(sender)) {
                    Log.d(TAG, "Sender not authorized: $sender")
                    continue
                }

                // Parse and validate OTP format
                val action = parseOfflineAction(messageBody)

                if (action != null) {
                    Log.d(TAG, "Valid offline action detected: $action")

                    storePendingAction(context, action)

                    notifyApp(context, action)

                    // Optional: Consume the SMS so it doesn't show in inbox
                    // abortBroadcast() // Uncomment if you want to hide SMS
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing SMS", e)
        }
    }

    private fun isAuthorizedSender(sender: String): Boolean {
        val normalizedSender = sender.replace(Regex("[\\s-]"), "")
        val normalizedAuthorized = AUTHORIZED_SENDER.replace(Regex("[\\s-]"), "")

        return normalizedSender.endsWith(normalizedAuthorized) ||
                normalizedAuthorized.endsWith(normalizedSender)
    }

    private fun parseOfflineAction(messageBody: String): OfflineAction? {
        return when {
            messageBody.matches(Regex(OFFLINE_OTP_PATTERN)) -> {
                val otp = messageBody.substringAfter("-")
                OfflineAction.ENABLE_OFFLINE(otp)
            }
            messageBody.matches(Regex(ONLINE_OTP_PATTERN)) -> {
                val otp = messageBody.substringAfter("-")
                OfflineAction.ENABLE_ONLINE(otp)
            }
            else -> null
        }
    }

    private fun storePendingAction(context: Context, action: OfflineAction) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_PENDING_SMS_ACTION, action.toJson())
            putLong(KEY_SMS_TIMESTAMP, System.currentTimeMillis())
            apply()
        }
        Log.d(TAG, "Stored pending action: $action")
    }

    private fun notifyApp(context: Context, action: OfflineAction) {
        try {
            // If app is running, send event via Turbo Module
            SmsOfflineModule.sendSmsActionEvent(action)
        } catch (e: Exception) {
            Log.d(TAG, "App not running, action stored for next launch")
        }
    }
}

sealed class OfflineAction {
    data class ENABLE_OFFLINE(val otp: String) : OfflineAction()
    data class ENABLE_ONLINE(val otp: String) : OfflineAction()

    fun toJson(): String {
        return when (this) {
            is ENABLE_OFFLINE -> """{"action":"offline","otp":"$otp"}"""
            is ENABLE_ONLINE -> """{"action":"online","otp":"$otp"}"""
        }
    }

    companion object {
        fun fromJson(json: String): OfflineAction? {
            return try {
                val action = json.substringAfter("\"action\":\"").substringBefore("\"")
                val otp = json.substringAfter("\"otp\":\"").substringBefore("\"")

                when (action) {
                    "offline" -> ENABLE_OFFLINE(otp)
                    "online" -> ENABLE_ONLINE(otp)
                    else -> null
                }
            } catch (e: Exception) {
                null
            }
        }
    }
}
