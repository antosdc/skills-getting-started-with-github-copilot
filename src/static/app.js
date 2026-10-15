document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, className) {
    messageDiv.textContent = message;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    const response = await fetch("/activities", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    const activities = await response.json();

    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <h5>Participants <span class="participant-count">${details.participants.length}</span></h5>
          <ul class="participant-list"></ul>
        </div>
      `;

      const participantList = activityCard.querySelector(".participant-list");
      details.participants.forEach((participant) => {
        const listItem = document.createElement("li");
        const participantEmail = document.createElement("span");
        participantEmail.textContent = participant;

        const unregisterButton = document.createElement("button");
        unregisterButton.type = "button";
        unregisterButton.className = "unregister-button";
        unregisterButton.setAttribute("aria-label", `Unregister ${participant}`);
        unregisterButton.title = `Unregister ${participant}`;
        unregisterButton.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" />
          </svg>
        `;
        unregisterButton.addEventListener("click", async () => {
          unregisterButton.disabled = true;
          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
              { method: "DELETE" }
            );
            const result = await response.json();

            if (!response.ok) {
              showMessage(result.detail || "Failed to unregister participant.", "error");
              return;
            }

            try {
              await fetchActivities();
              showMessage(result.message, "success");
            } catch (error) {
              showMessage(
                `${result.message}, but the activity list could not refresh. Please reload the page.`,
                "error"
              );
              console.error("Error refreshing activities after unregister:", error);
            }
          } catch (error) {
            showMessage("Failed to unregister participant. Please try again.", "error");
            console.error("Error unregistering participant:", error);
          }
        });

        listItem.append(participantEmail, unregisterButton);
        participantList.appendChild(listItem);
      });

      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-participants";
        emptyMessage.textContent = "No participants yet";
        participantList.appendChild(emptyMessage);
      }

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        try {
          await fetchActivities();
          showMessage(result.message, "success");
        } catch (error) {
          showMessage(
            `${result.message}, but the activity list could not refresh. Please reload the page.`,
            "error"
          );
          console.error("Error refreshing activities after signup:", error);
        }
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities().catch((error) => {
    activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
    console.error("Error fetching activities:", error);
  });
});
