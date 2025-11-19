package com.offlinemodepoc.sms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsOfflineModule(reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val MODULE_NAME = "SmsOfflineModule"
        private const val EVENT_SMS_ACTION = "onSmsOfflineAction"
        private const val PREFS_NAME = "OfflineModePrefs"
        private const val KEY_PENDING_SMS_ACTION = "pending_sms_action"
        private const val KEY_SMS_TIMESTAMP = "sms_timestamp"

        private var moduleInstance: SmsOfflineModule? = null

        fun sendSmsActionEvent(action: OfflineAction) {
            moduleInstance?.emitSmsActionEvent(action)
        }
    }

    init {
        moduleInstance = this
    }

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasReadSms =
                    ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) ==
                            PackageManager.PERMISSION_GRANTED

            val hasReceiveSms =
                    ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) ==
                            PackageManager.PERMISSION_GRANTED

            val result =
                    Arguments.createMap().apply {
                        putBoolean("hasReadSms", hasReadSms)
                        putBoolean("hasReceiveSms", hasReceiveSms)
                        putBoolean("allGranted", hasReadSms && hasReceiveSms)
                    }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun checkPendingSmsAction(promise: Promise) {
        try {
            val prefs =
                    reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val actionJson = prefs.getString(KEY_PENDING_SMS_ACTION, null)
            val timestamp = prefs.getLong(KEY_SMS_TIMESTAMP, 0)

            if (actionJson != null) {
                val action = OfflineAction.fromJson(actionJson)

                if (action != null) {
                    val result =
                            Arguments.createMap().apply {
                                putString(
                                        "action",
                                        when (action) {
                                            is OfflineAction.ENABLE_OFFLINE -> "offline"
                                            is OfflineAction.ENABLE_ONLINE -> "online"
                                        }
                                )
                                putString(
                                        "otp",
                                        when (action) {
                                            is OfflineAction.ENABLE_OFFLINE -> action.otp
                                            is OfflineAction.ENABLE_ONLINE -> action.otp
                                        }
                                )
                                putDouble("timestamp", timestamp.toDouble())
                            }

                    // Clear the pending action after reading
                    clearPendingAction()

                    promise.resolve(result)
                    return
                }
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CHECK_PENDING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearPendingAction(promise: Promise? = null) {
        try {
            val prefs =
                    reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                remove(KEY_PENDING_SMS_ACTION)
                remove(KEY_SMS_TIMESTAMP)
                apply()
            }
            promise?.resolve(true)
        } catch (e: Exception) {
            promise?.reject("CLEAR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSenderConfiguration(promise: Promise) {
        try {
            val config =
                    Arguments.createMap().apply {
                        putString("authorizedSender", "+254748755840") // Load from config
                        putString("offlinePattern", "OFFLINE-\\d{6}")
                        putString("onlinePattern", "ONLINE-\\d{6}")
                    }
            promise.resolve(config)
        } catch (e: Exception) {
            promise.reject("CONFIG_ERROR", e.message, e)
        }
    }

    private fun emitSmsActionEvent(action: OfflineAction) {
        val params =
                Arguments.createMap().apply {
                    putString(
                            "action",
                            when (action) {
                                is OfflineAction.ENABLE_OFFLINE -> "offline"
                                is OfflineAction.ENABLE_ONLINE -> "online"
                            }
                    )
                    putString(
                            "otp",
                            when (action) {
                                is OfflineAction.ENABLE_OFFLINE -> action.otp
                                is OfflineAction.ENABLE_ONLINE -> action.otp
                            }
                    )
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }

        reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_SMS_ACTION, params)
    }

    @ReactMethod fun addListener(eventName: String) {}

    @ReactMethod fun removeListeners(count: Int) {}
}
