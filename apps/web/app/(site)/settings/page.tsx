'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUserContext } from '@/app/hooks/use-backend-user';
import { useToast } from '@/app/components/toast';

interface SettingsForm {
  name: string;
  phone: string;
  website: string;
  licenseNumber: string;
}

export default function SettingsPage() {
  const { organization, refetch } = useUserContext();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    values: {
      name: organization?.name ?? '',
      phone: organization?.phone ?? '',
      website: organization?.website ?? '',
      licenseNumber: organization?.licenseNumber ?? '',
    },
  });

  const currentLogo = logoPreview ?? organization?.logoUrl ?? null;

  const onSubmit = async (data: SettingsForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/proxy/organizations/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone.trim() || undefined,
          website: data.website.trim() || undefined,
          licenseNumber: data.licenseNumber.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? 'Failed to save',
        );
      }
      addToast('success', 'Settings saved');
      await refetch();
    } catch (err) {
      addToast(
        'error',
        err instanceof Error ? err.message : 'Failed to save settings',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/proxy/organizations/me/logo', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? 'Failed to upload logo',
        );
      }
      addToast('success', 'Logo uploaded');
      await refetch();
    } catch (err) {
      setLogoPreview(null);
      addToast(
        'error',
        err instanceof Error ? err.message : 'Failed to upload logo',
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-[#0f0f12] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? 'border-red-400 dark:border-red-600 focus:ring-red-500/20'
        : 'border-gray-200 dark:border-gray-700 focus:ring-gray-900/10 dark:focus:ring-white/10'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Settings
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Manage your company profile. This information appears on your estimates
        and client communications.
      </p>

      {/* Company Profile */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5">
          Company Profile
        </h2>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f12] flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentLogo ? (
                <img
                  src={currentLogo}
                  alt="Company logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl font-semibold text-gray-300 dark:text-gray-600">
                  {organization.name[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Company Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Acme Contracting"
                {...register('name', { required: 'Company name is required' })}
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  className={inputClass(false)}
                />
              </div>
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  placeholder="https://acmecontracting.com"
                  {...register('website')}
                  className={inputClass(false)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="licenseNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                License Number
              </label>
              <input
                id="licenseNumber"
                type="text"
                placeholder="CSLB #123456"
                {...register('licenseNumber')}
                className={inputClass(false)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !isDirty}
              className="w-full mt-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white dark:border-gray-900/40 dark:border-t-gray-900 rounded-full animate-spin" />
              )}
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Sending Domain — Phase 3 placeholder */}
      <div className="bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 opacity-60">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          Sending Domain
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send estimates from your own email domain. Coming soon.
        </p>
      </div>
    </div>
  );
}
