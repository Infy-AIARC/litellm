import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select as AntdSelect,
  Tooltip,
  Typography,
} from "antd";
import type { FormInstance } from "antd";
import { modelAvailableCall } from "../networking";
import ConnectionErrorDisplay from "./model_connection_test";
import { all_admin_roles } from "@/utils/roles";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";
import { fetchAvailableModels, ModelGroup } from "../playground/llm_calls/fetch_models";
import RouterConfigBuilder from "./RouterConfigBuilder";
import NotificationManager from "../molecules/notifications_manager";

interface AddAutoRouterTabProps {
  form: FormInstance;
  handleOk: () => void;
  accessToken: string;
  userRole: string;
}

const { Title, Text } = Typography;

const AddAutoRouterTab: React.FC<AddAutoRouterTabProps> = ({
  form,
  handleOk,
  accessToken,
  userRole,
}) => {
  const [isResultModalVisible, setIsResultModalVisible] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestId, setConnectionTestId] = useState<string>("");
  const [modelAccessGroups, setModelAccessGroups] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const [routerConfig, setRouterConfig] = useState<any>(null);

  useEffect(() => {
    const fetchModelAccessGroups = async () => {
      const response = await modelAvailableCall(accessToken, "", "", false, null, true, true);
      setModelAccessGroups(response["data"].map((model: any) => model["id"]));
    };
    fetchModelAccessGroups();
  }, [accessToken]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        setModelInfo(uniqueModels);
      } catch (error) {
        // model list unavailable — user can still type a custom name
      }
    };
    loadModels();
  }, [accessToken]);

  const isAdmin = all_admin_roles.includes(userRole);

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setConnectionTestId(`test-${Date.now()}`);
    setIsResultModalVisible(true);
  };

  const handleAutoRouterSubmit = () => {
    const currentFormValues = form.getFieldsValue();

    if (!currentFormValues.auto_router_name) {
      NotificationManager.fromBackend("Please enter an Auto Router Name");
      return;
    }

    if (!currentFormValues.auto_router_default_model) {
      NotificationManager.fromBackend("Please select a Default Model");
      return;
    }

    if (!routerConfig || !routerConfig.routes || routerConfig.routes.length === 0) {
      NotificationManager.fromBackend("Please configure at least one route for the auto router");
      return;
    }

    const invalidRoutes = routerConfig.routes.filter(
      (route: any) => !route.name || !route.description || route.utterances.length === 0
    );
    if (invalidRoutes.length > 0) {
      NotificationManager.fromBackend(
        "Please ensure all routes have a target model, description, and at least one utterance"
      );
      return;
    }

    form
      .validateFields()
      .then((values) => {
        handleAddAutoRouterSubmit(
          { ...values, auto_router_config: routerConfig },
          accessToken,
          form,
          handleOk
        );
      })
      .catch((error) => {
        const fieldErrors = error.errorFields || [];
        if (fieldErrors.length > 0) {
          const friendlyNames: { [key: string]: string } = {
            auto_router_name: "Auto Router Name",
            auto_router_default_model: "Default Model",
            auto_router_embedding_model: "Embedding Model",
          };
          const missing = fieldErrors.map(
            (f: any) => friendlyNames[f.name[0]] || f.name[0]
          );
          NotificationManager.fromBackend(
            `Please fill in the following required fields: ${missing.join(", ")}`
          );
        } else {
          NotificationManager.fromBackend("Please fill in all required fields");
        }
      });
  };

  const modelOptions = [
    ...Array.from(new Set(modelInfo.map((m) => m.model_group))).map((g) => ({
      value: g,
      label: g,
    })),
  ];

  return (
    <>
      <Title level={2}>Add Auto Router</Title>
      <Text className="text-gray-600 mb-6">
        Create a semantic auto router that selects the best model based on user
        input patterns and route utterances.
      </Text>

      <Card>
        <Form
          form={form}
          onFinish={handleAutoRouterSubmit}
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
        >
          <Form.Item
            rules={[{ required: true, message: "Auto router name is required" }]}
            label="Auto Router Name"
            name="auto_router_name"
            tooltip="Unique name for this auto router configuration"
            labelCol={{ span: 10 }}
            labelAlign="left"
          >
            <Input placeholder="e.g., auto_router_1, smart_routing" />
          </Form.Item>

          <div className="w-full mb-4">
            <RouterConfigBuilder
              modelInfo={modelInfo}
              value={routerConfig}
              onChange={(config) => {
                setRouterConfig(config);
                form.setFieldValue("auto_router_config", config);
              }}
            />
          </div>

          <Form.Item
            rules={[{ required: true, message: "Default model is required" }]}
            label="Default Model"
            name="auto_router_default_model"
            tooltip="Fallback model when no route matches"
            labelCol={{ span: 10 }}
            labelAlign="left"
          >
            <AntdSelect
              placeholder="Select a default model"
              options={modelOptions}
              style={{ width: "100%" }}
              showSearch
            />
          </Form.Item>

          <Form.Item
            label="Embedding Model"
            name="auto_router_embedding_model"
            tooltip="Embedding model used for semantic route matching"
            labelCol={{ span: 10 }}
            labelAlign="left"
            rules={[{ required: true, message: "Embedding model is required" }]}
          >
            <AntdSelect
              placeholder="Select an embedding model"
              options={modelOptions}
              style={{ width: "100%" }}
              showSearch
            />
          </Form.Item>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="px-4 text-gray-500 text-sm">Additional Settings</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          {isAdmin && (
            <Form.Item
              label="Model Access Group"
              name="model_access_group"
              tooltip="Control which teams can access this auto router"
            >
              <AntdSelect
                mode="tags"
                showSearch
                placeholder="Select existing groups or type to create new ones"
                tokenSeparators={[","]}
                options={modelAccessGroups.map((g) => ({ value: g, label: g }))}
                maxTagCount="responsive"
                allowClear
              />
            </Form.Item>
          )}

          <div className="flex justify-between items-center mb-4">
            <Tooltip title="Get help on our github">
              <Typography.Link href="https://github.com/BerriAI/litellm/issues">
                Need Help?
              </Typography.Link>
            </Tooltip>
            <div className="space-x-2">
              <Button onClick={handleTestConnection} loading={isTestingConnection}>
                Test Connect
              </Button>
              <Button onClick={handleAutoRouterSubmit}>Add Auto Router</Button>
            </div>
          </div>
        </Form>
      </Card>

      <Modal
        title="Connection Test Results"
        open={isResultModalVisible}
        onCancel={() => {
          setIsResultModalVisible(false);
          setIsTestingConnection(false);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
          >
            Close
          </Button>,
        ]}
        width={700}
      >
        {isResultModalVisible && (
          <ConnectionErrorDisplay
            key={connectionTestId}
            formValues={form.getFieldsValue()}
            accessToken={accessToken}
            testMode="chat"
            modelName={form.getFieldValue("auto_router_name")}
            onClose={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
            onTestComplete={() => setIsTestingConnection(false)}
          />
        )}
      </Modal>
    </>
  );
};

export default AddAutoRouterTab;
