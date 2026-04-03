package com.example.safeher

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.content.Intent
import android.widget.Toast

class VolumeButtonAccessibilityService : AccessibilityService() {
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d("safeherDebug", "AccessibilityService: onServiceConnected")
        Toast.makeText(this, "safeher AccessibilityService connected", Toast.LENGTH_SHORT).show()
    }

    override fun onUnbind(intent: Intent?): Boolean {
        Log.d("safeherDebug", "AccessibilityService: onUnbind")
        return super.onUnbind(intent)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not used
        Log.d("safeherDebug", "AccessibilityService: onAccessibilityEvent: $event")
    }

    override fun onInterrupt() {
        Log.d("safeherDebug", "AccessibilityService: onInterrupt")
    }
}

