package com.pranshulgg.notesmaster;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;
import androidx.documentfile.provider.DocumentFile;

import android.animation.ArgbEvaluator;
import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.UriPermission;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.util.TypedValue;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.snackbar.Snackbar;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executor;

public class MainActivity extends AppCompatActivity {
    private WebView webview;
    private FrameLayout overlayLayout;
    private boolean isFirstLoad = true;
    public String notesData;
    private static final int REQUEST_CODE_PICK_FOLDER = 42;
    private static final String PREFS_NAME = "app_prefs";
    private static final String PREF_BACKUP_URI = "backup_folder_uri";

    @Override
    public void onBackPressed() {
        if (webview.canGoBack()) {
            webview.goBack();
        } else {
            super.onBackPressed();

        }
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SharedPreferences prefs = getSharedPreferences("theme_prefs", MODE_PRIVATE);
        boolean isDarkMode = prefs.getBoolean("theme_mode", false);

        setAppTheme(this, isDarkMode);
        super.onCreate(savedInstanceState);





        setContentView(R.layout.activity_main);
        overlayLayout = findViewById(R.id.overlayLayout);
        webview = findViewById(R.id.webView);
        WebSettings webSettings = webview.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setAllowContentAccess(true);
        webview.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webview.setVerticalScrollBarEnabled(false);
        webview.setHorizontalScrollBarEnabled(false);
        webSettings.setGeolocationEnabled(true);
        webSettings.setTextZoom(100);
        webview.getSettings().setAllowFileAccess(true);
        webview.getSettings().setAllowContentAccess(true);
        webview.getSettings().setDomStorageEnabled(true);
        webview.setWebViewClient(new WebViewClientDemo());
        AndroidInterface androidInterface = new AndroidInterface(this);
        webview.addJavascriptInterface(androidInterface, "AndroidInterface");
        webview.addJavascriptInterface(new NavigateActivityInterface(this), "OpenActivityInterface");
        webview.addJavascriptInterface(new ShowSnackInterface(this), "ShowSnackMessage");
        webview.addJavascriptInterface(new AndroidFunctionActivityInterface(this), "AndroidFunctionActivityInterface");
        webview.addJavascriptInterface(new WebAppInterface(this, this), "AndroidSaved");

        if (savedInstanceState != null) {
            webview.restoreState(savedInstanceState);
        } else {
            webview.loadUrl("file:///android_asset/index.html");
        }


        webview.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                if (isFirstLoad) {
                    isFirstLoad = false;

                    int primaryColor = new ContextThemeWrapper(MainActivity.this, R.style.ThemeMainBlackDark)
                            .getTheme()
                            .obtainStyledAttributes(new int[]{com.google.android.material.R.attr.colorPrimary})
                            .getColor(0, 0);

                    String hexColor = String.format("#%06X", (0xFFFFFF & primaryColor));
                    String jsCodePrimaryColor = "dynamicMaterial('" + hexColor + "');";
                    webview.evaluateJavascript(jsCodePrimaryColor, null);

                    SharedPreferences prefsFolderName = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                    String savedUri = prefsFolderName.getString(PREF_BACKUP_URI, null);

                    if (savedUri != null) {
                        Uri folderUri = Uri.parse(savedUri);
                        if (isUriPermissionStillGranted(folderUri)) {
                            String folderName = getFolderDisplayName(folderUri);
                            webview.evaluateJavascript("setFolderInStorage('"+ folderName + "')", null);

                        } else {
                            webview.evaluateJavascript("removeFolderInStorage();", null);
                        }
                    }

                }
            }
        });



    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webview.saveState(outState);
    }

    public void hideOverlay() {
        overlayLayout.setVisibility(View.GONE);
    }


    private String getFolderDisplayName(Uri uri) {
        DocumentFile documentFile = DocumentFile.fromTreeUri(this, uri);
        if (documentFile != null && documentFile.getName() != null) {
            String volumeName = getVolumeName(uri);
            return volumeName + "/" + documentFile.getName();
        } else {
            return "Unknown Folder";
        }
    }

    private String getVolumeName(Uri uri) {
        String uriAuthority = uri.getAuthority();
        String uriPath = uri.getPath();

        if (uriAuthority == null || uriPath == null) {
            return "Storage";
        }

        if (uriAuthority.equals("com.android.externalstorage.documents")) {
            if (uriPath.contains("primary:")) {
                return "Internal Storage";
            } else {
                // Extract SD card label or default to "SD Card"
                return "SD Card";
            }
        } else if (uriAuthority.equals("com.android.providers.downloads.documents")) {
            return "Downloads";
        } else if (uriAuthority.equals("com.android.providers.media.documents")) {
            return "Media";
        } else {
            return "Storage";
        }
    }

    public void saveBackup() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUri = prefs.getString(PREF_BACKUP_URI, null);

        if (savedUri != null) {
            Uri folderUri = Uri.parse(savedUri);
            boolean hasPermission = isUriPermissionStillGranted(folderUri);

            if (hasPermission) {
                saveJsonToFolder(folderUri, notesData);
            } else {
                Toast.makeText(this, "Folder permission lost. Please reselect.", Toast.LENGTH_LONG).show();
                pickBackupFolder();
            }
        } else {
            Toast.makeText(this, "Please select a backup folder first.", Toast.LENGTH_LONG).show();
            pickBackupFolder();
        }
    }


    // Launch the folder picker
    public void pickBackupFolder() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(intent, REQUEST_CODE_PICK_FOLDER);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_CODE_PICK_FOLDER && resultCode == RESULT_OK && data != null) {
            new Handler().postDelayed(() -> {

            Uri folderUri = data.getData();

            int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            if (takeFlags == 0) {
                takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            }
            try {
                getContentResolver().takePersistableUriPermission(folderUri, takeFlags);
            } catch (SecurityException e) {
                e.printStackTrace();
                Toast.makeText(this, "Could not persist folder permission. Try again.", Toast.LENGTH_LONG).show();
                return;
            }
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                    .edit()
                    .putString(PREF_BACKUP_URI, folderUri.toString())
                    .apply();

            Toast.makeText(this, "Backup folder selected.", Toast.LENGTH_SHORT).show();

            restartApp();
            }, 300);

        }
    }

    private boolean isUriPermissionStillGranted(Uri uri) {
        List<UriPermission> permissions = getContentResolver().getPersistedUriPermissions();
        for (UriPermission permission : permissions) {
            Log.d("PermissionCheck", "Found: " + permission.getUri() + ", granted: " + permission.isWritePermission());
            if (permission.getUri().equals(uri)
                    && permission.isReadPermission()
                    && permission.isWritePermission()) {
                return true;
            }
        }
        return false;
    }



    private void saveJsonToFolder(Uri folderUri, String jsonContent) {
        try {
            DocumentFile pickedDir = DocumentFile.fromTreeUri(this, folderUri);
            if (pickedDir == null || !pickedDir.isDirectory()) {
                Toast.makeText(this, "Invalid folder selected.", Toast.LENGTH_LONG).show();
                return;
            }

            DocumentFile[] files = pickedDir.listFiles();
            List<DocumentFile> backupFiles = new ArrayList<>();
            for (DocumentFile file : files) {
                if (file.getName() != null && file.getName().startsWith("notes_backup_") && file.getName().endsWith(".json")) {
                    backupFiles.add(file);
                }
            }

            Collections.sort(backupFiles, new Comparator<DocumentFile>() {
                @Override
                public int compare(DocumentFile f1, DocumentFile f2) {
                    return f2.getName().compareTo(f1.getName());
                }
            });


            for (int i = 2; i < backupFiles.size(); i++) {
                backupFiles.get(i).delete();
            }

            String timeStamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm", Locale.getDefault()).format(new Date());
            String fileName = "notes_backup_" + timeStamp + ".json";
            DocumentFile file = pickedDir.createFile("application/json", fileName);

            OutputStream out = getContentResolver().openOutputStream(file.getUri());
            out.write(jsonContent.getBytes(StandardCharsets.UTF_8));
            out.close();

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Failed to save file: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }


    private void checkBiometricSupport() {
        BiometricManager biometricManager = BiometricManager.from(this);

        switch (biometricManager.canAuthenticate()) {
            case BiometricManager.BIOMETRIC_SUCCESS:

                break;

            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                break;

            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:

                break;

            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:

                break;
        }
    }

    private void showBiometricPrompt() {
        Executor executor = ContextCompat.getMainExecutor(this);
        BiometricPrompt biometricPrompt = new BiometricPrompt(MainActivity.this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);

                if (errorCode == BiometricPrompt.ERROR_USER_CANCELED || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                }

            }

            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                callJavaScriptFunction();

            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();

            }
        });

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock locked label")
                .setSubtitle("Authenticate using your biometric credentials")
                .setConfirmationRequired(false)
                .setNegativeButtonText("Cancel")
                .build();

        biometricPrompt.authenticate(promptInfo);
    }

    private void callJavaScriptFunction() {

        webview.evaluateJavascript("javascript:viewLockedNotes();", null);
    }


    public class NavigateActivityInterface {
        private final Context mContext;

        public NavigateActivityInterface(Context context) {
            this.mContext = context;
        }

        @JavascriptInterface
        public void OpenActivity(final String activityName) {
            Intent intent = null;

            switch (activityName) {
                case "SettingsActivity":
                    intent = new Intent(mContext, SettingsActivity.class);
                    break;
                case "NotesViewActivity":
                    intent = new Intent(mContext, NoteView.class);
                    break;
                case "LabelsActivity":
                    intent = new Intent(mContext, LabelsActivity.class);
                    break;
                case "GoBack":
                    back();
                    break;
                default:
                    Toast.makeText(mContext, "Activity not found", Toast.LENGTH_SHORT).show();
                    return;
            }

            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mContext.startActivity(intent);
        }
    }

    public class ShowSnackInterface {
        private final Context mContext;

        public ShowSnackInterface(Context context) {
            this.mContext = context;
        }

        @JavascriptInterface
        public void ShowSnack(final String text, final String time) {
            int duration = Snackbar.LENGTH_SHORT;
            if ("long".equals(time)) {
                duration = Snackbar.LENGTH_LONG;
            } else if ("short".equals(time)){
                duration = Snackbar.LENGTH_SHORT;
            }


            Snackbar snackbar = Snackbar.make(((Activity) mContext).findViewById(android.R.id.content), text, duration);

            View snackbarView = snackbar.getView();



            TextView textView = snackbarView.findViewById(com.google.android.material.R.id.snackbar_text);
            textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            Typeface typeface = ResourcesCompat.getFont(mContext, R.font.roboto_medium);
            textView.setTypeface(typeface);


            ViewGroup.LayoutParams params = snackbar.getView().getLayoutParams();
            if (params instanceof ViewGroup.MarginLayoutParams) {
                ViewGroup.MarginLayoutParams marginParams = (ViewGroup.MarginLayoutParams) params;
                marginParams.bottomMargin = 34;
                marginParams.leftMargin = 26;
                marginParams.rightMargin = 26;
                snackbar.getView().setLayoutParams(marginParams);
            }


            snackbar.show();
        }
    }

    public void back() {
        onBackPressed();
    }

    public class AndroidFunctionActivityInterface {
        private MainActivity mActivity;

        AndroidFunctionActivityInterface(MainActivity activity) {
            mActivity = activity;
        }

        @JavascriptInterface
        public void androidFunction(final String functiontype) {
            mActivity.runOnUiThread(new Runnable() {
                @SuppressLint("ResourceType")
                @RequiresApi(api = Build.VERSION_CODES.O)
                @Override
                public void run() {
                    if (functiontype.equals("ShowBiometric")){
                        checkBiometricSupport();
                        showBiometricPrompt();
                        return;
                    } else if (functiontype.equals("hideSurfaceOverlay")){
                        hideOverlay();
                        return;
                    } else if (functiontype.equals("ReloadDynamicColors")){
                        isFirstLoad = true;
                        webview.reload();
                        return;
                    } else if (functiontype.equals("pickAfolderOnly")) {
                        pickBackupFolder();
                        return;
                    }
                }
            });
        }
    }

    private void restartApp() {
        Toast.makeText(this, "App is restarting...", Toast.LENGTH_SHORT).show();

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();
            }
        }, 500);
    }

    public class WebAppInterface {
        Context mContext;
        MainActivity activity;

        WebAppInterface(Context c, MainActivity activity) {
            mContext = c;
            this.activity = activity;
        }

        @JavascriptInterface
        public void sendNotesData(String notesJson) {
            activity.notesData = notesJson;
            activity.saveBackup();
        }
    }


    public class AndroidInterface {
        private MainActivity mActivity;

        AndroidInterface(MainActivity activity) {
            mActivity = activity;
        }

        @JavascriptInterface
        public void updateStatusBarColor(final String colorStatus, final String colorNav, final String UiFlag, final String FlagAnim) {
            mActivity.runOnUiThread(new Runnable() {
                @SuppressLint("ResourceType")
                @RequiresApi(api = Build.VERSION_CODES.O)
                @Override
                public void run() {
                    int statusBarColor;
                    int navigationBarColor;
                    int systemUiVisibilityFlags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;

                    if (colorStatus != null && !colorStatus.isEmpty()) {
                        statusBarColor = Color.parseColor(colorStatus);
                        navigationBarColor = Color.parseColor(colorNav);
                        if ("1".equals(UiFlag)) {
                            systemUiVisibilityFlags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        } else {
                            systemUiVisibilityFlags = 0;
                        }
                    } else {
                        Toast.makeText(mActivity, "not found", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    int currentStatusBarColor = mActivity.getWindow().getStatusBarColor();
                    int currentNavigationBarColor = mActivity.getWindow().getNavigationBarColor();

                    int animationDuration = 0;
                    try {
                        animationDuration = Integer.parseInt(FlagAnim);
                    } catch (NumberFormatException e) {
                        animationDuration = 0;
                    }


                    ObjectAnimator statusBarAnimator = ObjectAnimator.ofObject(
                            mActivity.getWindow(),
                            "statusBarColor",
                            new ArgbEvaluator(),
                            currentStatusBarColor,
                            statusBarColor
                    );

                    statusBarAnimator.setDuration(animationDuration);
                    statusBarAnimator.start();

                    ObjectAnimator navBarAnimator = ObjectAnimator.ofObject(
                            mActivity.getWindow(),
                            "navigationBarColor",
                            new ArgbEvaluator(),
                            currentNavigationBarColor,
                            navigationBarColor
                    );

                    navBarAnimator.setDuration(animationDuration);
                    navBarAnimator.start();

                    mActivity.getWindow().setNavigationBarColor(navigationBarColor);

                    View decorView = mActivity.getWindow().getDecorView();
                    decorView.setSystemUiVisibility(systemUiVisibilityFlags);

                }
            });
        }
}

    private class WebViewClientDemo extends WebViewClient {



    }

    public void setAppTheme(Context context, boolean isDarkMode) {
        // Save theme preference
        SharedPreferences prefs = context.getSharedPreferences("theme_prefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("theme_mode", isDarkMode).apply();

        // Apply the theme
        if (isDarkMode) {
            context.setTheme(R.style.ThemeMainBlackDark);
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            context.setTheme(R.style.ThemeMainBlackLight);
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                );
            }
    }
}

