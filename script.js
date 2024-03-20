function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}
function getCookie(name) {
    const cookieName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) == " ") {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(cookieName) == 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return "";
}
function toggleTheme() {
    const body = document.body;
    const container = document.getElementById("timingsContainer");
    const header = document.getElementById("header");
    const themeIcon = document.getElementById("themeIcon");
    const currentIcon = themeIcon.innerText;
    body.classList.toggle("dark-mode-body");
    container.classList.toggle("dark-mode-container");
    header.classList.toggle("dark-mode-header");
    document.documentElement.classList.toggle("sl-theme-dark");
    if (currentIcon === "light_mode") {
        themeIcon.innerText = "dark_mode";
        setCookie("theme", "dark", 365);
    } else {
        themeIcon.innerText = "light_mode";
        setCookie("theme", "light", 365);
    }
}
function setThemeFromCookie() {
    const theme = getCookie("theme");
    if (theme === "dark") {
        toggleTheme();
    }
}
setThemeFromCookie();

document.addEventListener("DOMContentLoaded", function () {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
    const year = today.getFullYear();
    const currentDate = `${day}-${month}-${year}`;
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    const formattedDate = today.toLocaleDateString("id-ID", options);
    document.getElementById("date").textContent = formattedDate;

    const apiUrl =
        "https://api.aladhan.com/v1/timings/${currentDate}?longitude=107.758736&latitude=-6.571589";

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const hijriWeekday = data.data.date.hijri.weekday.en;
            const hijriDay = data.data.date.hijri.day;
            const hijriMonth = data.data.date.hijri.month.en;
            const hijriYear = data.data.date.hijri.year;
            document.getElementById("hijriDate").textContent =
                hijriWeekday +
                ", " +
                hijriDay +
                " " +
                hijriMonth +
                " " +
                hijriYear;
            const timings = data.data.timings;

            delete timings.Sunset;

            const timingsArray = Object.entries(timings);

            const translatedNames = {
                Lastthird: "Sepertiga Ketiga",
                Imsak: "Imsak",
                Fajr: "Subuh",
                Sunrise: "Terbit (Dhuha)",
                Dhuhr: "Dzuhur",
                Asr: "Ashar",
                Maghrib: "Maghrib",
                Isha: "Isya",
                Firstthird: "Sepertiga Pertama",
                Midnight: "Sepertiga Kedua"
            };

            timingsArray.sort((a, b) => {
                const timeA = getTimeValue(a);
                const timeB = getTimeValue(b);
                return timeA - timeB;
            });
            const timingsContainer =
                document.getElementById("timingsContainer");
            timingsArray.forEach(timing => {
                const translatedName = translatedNames[timing[0]] || timing[0];
                const card = createCard(translatedName, timing[1]);
                timingsContainer.appendChild(card);
            });
            setInterval(function () {
                countdownToNextPrayer(data.data.timings);
            }, 500);
            setInterval(function () {
                updateProgressBar(data.data.timings);
            }, 1000);
        });
});

function createCard(title, time) {
    const card = document.createElement("sl-card");
    card.classList.add("card");
    card.innerHTML = `
        <h3>${title}</h3>
        <p>${time}</p>
    `;
    return card;
}

function getTimeValue(timing) {
    const timeName = timing[0];
    if (timeName === "Midnight") return 24 * 60;
    if (timeName === "Lastthird") return 23 * 60 + 60;
    return convertToMinutes(timing[1]);
}

function convertToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
}
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    document.getElementById(
        "current-time"
    ).textContent = `${hours}:${minutes}:${seconds}`;
}

function countdownToNextPrayer(prayerTimings) {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    let nextPrayerTime;
    let nextPrayerName;

    // Loop through prayer timings to find the next prayer
    for (const [prayerName, prayerTime] of Object.entries(prayerTimings)) {
        const prayerTimeInMinutes = convertToMinutes(prayerTime);
        if (prayerTimeInMinutes > currentTimeInMinutes) {
            nextPrayerTime = prayerTimeInMinutes;
            nextPrayerName = prayerName;
            break;
        }
    }

    if (nextPrayerTime && nextPrayerName) {
        const timeDifference = nextPrayerTime - currentTimeInMinutes;
        const hoursRemaining = Math.floor(timeDifference / 60);
        const minutesRemaining = timeDifference % 60;
        const secondsRemaining = (60 - now.getSeconds()) % 60;

        const countdownText = `${hoursRemaining} jam ${minutesRemaining} menit ${secondsRemaining} detik menuju ${nextPrayerName}`;
        document.getElementById("countdown").textContent = countdownText;
    } else {
        document.getElementById("countdown").textContent =
            "Tidak ada sholat berikutnya hari ini.";
    }
}
function updateProgressBar(prayerTimings) {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    let nextPrayerTime;

    // Loop through prayer timings to find the next prayer
    for (const [, prayerTime] of Object.entries(prayerTimings)) {
        const prayerTimeInMinutes = convertToMinutes(prayerTime);
        if (prayerTimeInMinutes > currentTimeInMinutes) {
            nextPrayerTime = prayerTimeInMinutes;
            break;
        }
    }

    if (nextPrayerTime) {
        const timeDifference = nextPrayerTime - currentTimeInMinutes;
        const progressBarValue = (timeDifference / 60) * 100; // Convert to percentage
        document.getElementById("progressBar").value = 100 - progressBarValue;
    } else {
        document.getElementById("progressBar").value = 100; // Sholat berikutnya belum tersedia, jadi progress bar diatur ke 100%
    }
}

setInterval(updateClock, 500);