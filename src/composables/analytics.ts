/* eslint-disable @typescript-eslint/camelcase */
type Params = {
  event_category: string;
  event_label: string;
  [key: string]: unknown;
};

export default (
  category: string,
  action: string,
  label = "",
  options = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    non_interaction: true
  }
) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  if (typeof gtag === "undefined") {
    return;
  }

  const params: Params = {
    event_category: category,
    event_label: label,
    ...options
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  gtag("event", action, params);
};
