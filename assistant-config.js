window.resumeAssistantConfig = {
  apiEndpoint: getResumeAssistantEndpoint(),
};

function getResumeAssistantEndpoint() {
  const hostname = window.location.hostname;
  if (hostname.endsWith("vercel.app")) return "/api/resume-assistant";
  if (hostname.endsWith("netlify.app")) return "/.netlify/functions/resume-assistant";
  return "";
}
