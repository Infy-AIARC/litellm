import { modelCreateCall, Model } from "../networking";
import NotificationManager from "../molecules/notifications_manager";

export const handleAddAutoRouterSubmit = async (
  values: any,
  accessToken: string,
  form: any,
  callback?: () => void,
) => {
  try {
    const autoRouterConfig: any = {
      model_name: values.auto_router_name,
      litellm_params: {
        model: `auto_router/${values.auto_router_name}`,
        auto_router_config: JSON.stringify(values.auto_router_config),
        auto_router_default_model: values.auto_router_default_model,
        auto_router_embedding_model: values.auto_router_embedding_model,
      },
      model_info: {},
    };

    if (values.team_id) {
      autoRouterConfig.model_info.team_id = values.team_id;
    }

    if (values.model_access_group && values.model_access_group.length > 0) {
      autoRouterConfig.model_info.access_groups = values.model_access_group;
    }

    await modelCreateCall(accessToken, autoRouterConfig as Model);
    form.resetFields();
    callback?.();
  } catch (error) {
    NotificationManager.fromBackend("Failed to add auto router: " + error);
  }
};

