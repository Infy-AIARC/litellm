import React from "react";
import { Form, Tabs } from "antd";
import type { FormInstance } from "antd";
import type { UploadProps } from "antd/es/upload";
import type { Team } from "../key_team_helpers/key_list";
import { type CredentialItem } from "../networking";
import { Providers } from "../provider_info_helpers";
import AddAutoRouterTab from "./add_auto_router_tab";
import AddAdeptRouterTab from "./add_adept_router_tab";
import AddModelForm from "./AddModelForm";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";

interface AddModelTabProps {
  form: FormInstance; // For the Add Model tab
  handleOk: (values?: any) => Promise<void>;
  // Refresh-only callback invoked after a non-standard model (ADEPT) is
  // created. Must not re-trigger the Add Model form validation — that's what
  // `handleOk` does, and reusing it as a "did-succeed" hook causes the
  // empty-form validation error to fire after a successful save.
  onModelAdded?: () => void;
  selectedProvider: Providers;
  setSelectedProvider: (provider: Providers) => void;
  providerModels: string[];
  setProviderModelsFn: (provider: Providers) => void;
  getPlaceholder: (provider: Providers) => string;
  uploadProps: UploadProps;
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean) => void;
  teams: Team[] | null;
  credentials: CredentialItem[];
  accessToken: string;
  userRole: string;
}

const AddModelTab: React.FC<AddModelTabProps> = ({
  form,
  handleOk,
  onModelAdded,
  selectedProvider,
  setSelectedProvider,
  providerModels,
  setProviderModelsFn,
  getPlaceholder,
  uploadProps,
  showAdvancedSettings,
  setShowAdvancedSettings,
  teams,
  credentials,
  accessToken,
  userRole,
}) => {
  const [autoRouterForm] = Form.useForm();
  const [adeptRouterForm] = Form.useForm();

  const handleAutoRouterOk = () => {
    autoRouterForm
      .validateFields()
      .then((values) => {
        handleAddAutoRouterSubmit(values, accessToken, autoRouterForm, handleOk);
      })
      .catch(() => {
        // validation errors are displayed inline
      });
  };

  const tabItems = [
    {
      key: "add_model",
      label: "Add Model",
      children: (
        <AddModelForm
          form={form}
          handleOk={handleOk}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          providerModels={providerModels}
          setProviderModelsFn={setProviderModelsFn}
          getPlaceholder={getPlaceholder}
          uploadProps={uploadProps}
          showAdvancedSettings={showAdvancedSettings}
          setShowAdvancedSettings={setShowAdvancedSettings}
          teams={teams}
          credentials={credentials}
        />
      ),
    },
    {
      key: "add_auto_router",
      label: "Add Auto Router",
      children: (
        <AddAutoRouterTab
          form={autoRouterForm}
          handleOk={handleAutoRouterOk}
          accessToken={accessToken}
          userRole={userRole}
        />
      ),
    },
    {
      key: "add_adept_router",
      label: "Add ADEPT Router",
      children: (
        <AddAdeptRouterTab
          form={adeptRouterForm}
          onSuccess={onModelAdded}
          accessToken={accessToken}
          userRole={userRole}
        />
      ),
    },
  ];

  return <Tabs items={tabItems} className="w-full" />;
};

export default AddModelTab;
