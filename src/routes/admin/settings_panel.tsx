// src/pages/admin/SettingsPanel.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  Database,
  Mail,
  MessageSquare,
  Save,
  Send,
  Settings as SettingsIcon,
  Shield,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoadingOverlay } from "../../components";
import { fetchApi } from "../../lib/api";

// Settings Types
interface SystemSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderDaysBefore: number;
  autoApprovalEnabled: boolean;
  requireOcrVerification: boolean;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  twilio: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  };
  email: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail?: string;
  };
}

interface SmsTestForm {
  phoneNumber: string;
  message: string;
}

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<
    "general" | "notifications" | "integration" | "advanced"
  >("general");
  const queryClient = useQueryClient();

  // Fetch settings - endpoint: GET /settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["settings"],
    queryFn: () => fetchApi("/settings"),
  });

  if (isLoading) return <LoadingOverlay />;
  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Configure system preferences and integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <Tab
          active={activeTab === "general"}
          onClick={() => setActiveTab("general")}
          icon={SettingsIcon}
        >
          General
        </Tab>
        <Tab
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          icon={Bell}
        >
          Notifications
        </Tab>
        <Tab
          active={activeTab === "integration"}
          onClick={() => setActiveTab("integration")}
          icon={MessageSquare}
        >
          Integrations
        </Tab>
        <Tab
          active={activeTab === "advanced"}
          onClick={() => setActiveTab("advanced")}
          icon={Shield}
        >
          Advanced
        </Tab>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "general" && <GeneralSettings settings={settings} />}
        {activeTab === "notifications" && (
          <NotificationsSettings settings={settings} />
        )}
        {activeTab === "integration" && (
          <IntegrationSettings settings={settings} />
        )}
        {activeTab === "advanced" && <AdvancedSettings settings={settings} />}
      </div>
    </div>
  );
}

// Tab Component
function Tab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition ${
        active
          ? "border-b-2 border-brand text-brand"
          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

// General Settings Tab
function GeneralSettings({ settings }: { settings: SystemSettings }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      reminderDaysBefore: settings.reminderDaysBefore,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes.join(", "),
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi("/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      console.log("✓ Settings updated");
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      ...data,
      allowedFileTypes: data.allowedFileTypes
        .split(",")
        .map((s: string) => s.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>

          {/* Reminder Days */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Reminder Days Before Expiration
            </label>
            <input
              {...register("reminderDaysBefore", { valueAsNumber: true })}
              type="number"
              className="field w-full sm:w-64"
              min="1"
              max="90"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Send reminders this many days before COI expiration (1-90 days)
            </p>
          </div>

          {/* Max File Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Maximum File Size (MB)
            </label>
            <input
              {...register("maxFileSize", { valueAsNumber: true })}
              type="number"
              className="field w-full sm:w-64"
              min="1"
              max="50"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Maximum upload size in megabytes (1-50 MB)
            </p>
          </div>

          {/* Allowed File Types */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Allowed File Types
            </label>
            <input
              {...register("allowedFileTypes")}
              type="text"
              className="field w-full"
              placeholder="pdf, jpg, png"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Comma-separated list of allowed file extensions
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
}

// Notifications Settings Tab
function NotificationsSettings({ settings }: { settings: SystemSettings }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) =>
      fetchApi("/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      console.log("✓ Notification settings updated");
    },
  });

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-6">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>

        {/* Email Notifications */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Send notifications via email for COI updates and reminders
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                toggleMutation.mutate({ emailNotifications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-brand rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand"></div>
          </label>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">SMS Notifications</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Send text messages for urgent notifications and reminders
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) =>
                toggleMutation.mutate({ smsNotifications: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-brand rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand"></div>
          </label>
        </div>
      </div>

      {/* Test SMS */}
      <TestSmsSection />
    </div>
  );
}

// Test SMS Section
function TestSmsSection() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SmsTestForm>({
    defaultValues: {
      phoneNumber: "",
      message: "This is a test message from Tally COI system.",
    },
  });

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const testSmsMutation = useMutation({
    mutationFn: (data: SmsTestForm) =>
      fetchApi("/settings/test-sms", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setResult({ success: true, message: "Test SMS sent successfully!" });
      setTimeout(() => setResult(null), 5000);
    },
    onError: (error: any) => {
      setResult({
        success: false,
        message: error.message || "Failed to send test SMS",
      });
      setTimeout(() => setResult(null), 5000);
    },
  });

  const onSubmit = (data: SmsTestForm) => {
    testSmsMutation.mutate(data);
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Test SMS</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        Send a test SMS to verify your Twilio configuration
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number *
          </label>
          <input
            {...register("phoneNumber", {
              required: "Phone number is required",
              pattern: {
                value: /^\+?[1-9]\d{1,14}$/,
                message: "Invalid phone number (use E.164 format: +1234567890)",
              },
            })}
            type="tel"
            className="field w-full"
            placeholder="+1234567890"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600 mt-1">
              {errors.phoneNumber.message}
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            Use E.164 format (e.g., +1234567890)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            {...register("message", { required: "Message is required" })}
            className="field w-full"
            rows={3}
          />
          {errors.message && (
            <p className="text-sm text-red-600 mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Shield className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`text-sm ${
                  result.success
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {result.message}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={testSmsMutation.isPending}
        >
          <Send className="h-4 w-4" />
          {testSmsMutation.isPending ? "Sending..." : "Send Test SMS"}
        </button>
      </form>
    </div>
  );
}

// Integration Settings Tab
function IntegrationSettings({ settings }: { settings: SystemSettings }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues: settings.twilio,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi("/settings/twilio", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      console.log("✓ Twilio settings updated");
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Twilio Configuration</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Configure Twilio for SMS notifications
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Account SID
              </label>
              <input
                {...register("accountSid")}
                type="text"
                className="field w-full font-mono text-sm"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Auth Token
              </label>
              <input
                {...register("authToken")}
                type="password"
                className="field w-full font-mono text-sm"
                placeholder="********************************"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                From Number
              </label>
              <input
                {...register("fromNumber")}
                type="tel"
                className="field w-full"
                placeholder="+1234567890"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Your Twilio phone number in E.164 format
              </p>
            </div>
          </div>
        </div>

        {isDirty && (
          <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Twilio Settings"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

// Advanced Settings Tab
function AdvancedSettings({ settings }: { settings: SystemSettings }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) =>
      fetchApi("/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      console.log("✓ Advanced settings updated");
    },
  });

  return (
    <div className="card p-6 space-y-6">
      <h3 className="text-lg font-semibold">Advanced Settings</h3>

      {/* Auto Approval */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium">Auto-Approval</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Automatically approve COIs that meet all requirements
            </p>
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Use with caution. Manual review is recommended for compliance.
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoApprovalEnabled}
            onChange={(e) =>
              toggleMutation.mutate({ autoApprovalEnabled: e.target.checked })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-brand rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand"></div>
        </label>
      </div>

      {/* Require OCR Verification */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Database className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium">Require OCR Verification</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Force manual verification of OCR-extracted data before approval
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireOcrVerification}
            onChange={(e) =>
              toggleMutation.mutate({
                requireOcrVerification: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-brand rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand"></div>
        </label>
      </div>
    </div>
  );
}
