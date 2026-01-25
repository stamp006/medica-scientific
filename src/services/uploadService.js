export function uploadSimulation(file, { onStatus } = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    const payloadSummary = Array.from(formData.entries()).map(([key, value]) => {
      if (value instanceof File) {
        return [key, `${value.name} (${value.size} bytes)`];
      }
      return [key, value];
    });
    console.log("Upload payload:", payloadSummary);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload");
    xhr.responseType = "json";

    xhr.upload.onloadstart = () => {
      onStatus?.("Uploading...");
    };

    xhr.upload.onloadend = () => {
      onStatus?.("Analyzing...");
    };

    xhr.onload = () => {
      const response = xhr.response || {};
      console.log("Upload response:", response);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response);
        return;
      }
      reject(new Error(response.error || "Upload failed. Please try again."));
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading."));
    };

    xhr.send(formData);
  });
}
