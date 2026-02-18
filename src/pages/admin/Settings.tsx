import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Bell, Shield, Cog } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

const Settings = () => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-8 py-12 shadow-sm`}>
        <div className="flex items-center gap-3">
          <SettingsIcon className={`h-10 w-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your admin preferences
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-6">
        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'border-gray-200 bg-white'} hover:shadow-lg transition-shadow`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profile Management</CardTitle>
            </div>
            <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Configure your profile settings, update contact information, and manage your account preferences.
            </p>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'border-gray-200 bg-white'} hover:shadow-lg transition-shadow`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</CardTitle>
            </div>
            <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Customize how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Manage email notifications, system alerts, and other communication preferences.
            </p>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'border-gray-200 bg-white'} hover:shadow-lg transition-shadow`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Security Settings</CardTitle>
            </div>
            <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Change your password, enable two-factor authentication, and review security settings.
            </p>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'border-gray-200 bg-white'} hover:shadow-lg transition-shadow`}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-blue-600" />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Configuration</CardTitle>
            </div>
            <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Advanced system settings and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Configure system-wide settings, integrations, and other advanced options.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
