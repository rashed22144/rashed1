import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, User as UserIcon, Bell, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/lib/LanguageContext';

export default function SettingsPage() {
    const { t, dir } = useLanguage();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        bio: '',
        notifications_enabled: true,
        email_notifications: true,
        marketing_emails: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            setFormData({
                full_name: currentUser.full_name || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || '',
                notifications_enabled: currentUser.notifications_enabled ?? true,
                email_notifications: currentUser.email_notifications ?? true,
                marketing_emails: currentUser.marketing_emails ?? false
            });
        } catch (error) {
            console.error('خطأ في جلب بيانات المستخدم:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (field, checked) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await User.updateMyUserData(formData);
            setSuccessMessage(t('savedSuccessfully'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('خطأ في حفظ الإعدادات:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir={dir}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('accountSettings')}</h1>
                <p className="text-gray-600">{t('customizeAccount')}</p>
            </div>

            {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                        {successMessage}
                    </AlertDescription>
                </Alert>
            )}

            {/* Personal Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        {t('personalInfo')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="full_name">{t('fullNameLabel')}</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder={t('enterFullName')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">{t('phoneNumber')}</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder={t('phonePlaceholder')}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <Label>{t('emailAddress')}</Label>
                        <Input value={user?.email || ''} disabled className="bg-gray-50" />
                        <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
                    </div>

                    <div>
                        <Label htmlFor="bio">{t('bio')}</Label>
                        <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder={t('bioPlaceholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="4"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        {t('notificationSettings')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{t('generalNotifications')}</h3>
                            <p className="text-sm text-gray-500">{t('generalNotificationsDesc')}</p>
                        </div>
                        <Switch
                            checked={formData.notifications_enabled}
                            onCheckedChange={(checked) => handleSwitchChange('notifications_enabled', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{t('emailNotifications')}</h3>
                            <p className="text-sm text-gray-500">{t('emailNotificationsDesc')}</p>
                        </div>
                        <Switch
                            checked={formData.email_notifications}
                            onCheckedChange={(checked) => handleSwitchChange('email_notifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{t('marketingEmails')}</h3>
                            <p className="text-sm text-gray-500">{t('marketingEmailsDesc')}</p>
                        </div>
                        <Switch
                            checked={formData.marketing_emails}
                            onCheckedChange={(checked) => handleSwitchChange('marketing_emails', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {t('securityPrivacy')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">{t('accountProtection')}</h3>
                        <p className="text-sm text-blue-700 mb-3">
                            {t('protectedByGoogle')}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-sm text-green-700">{t('googleAuthProtected')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    size="lg"
                >
                    <Save className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {isSaving ? t('saving') : t('saveSettings')}
                </Button>
            </div>
        </div>
    );
}
