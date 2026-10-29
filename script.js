document.addEventListener("DOMContentLoaded", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealItems = document.querySelectorAll(
        ".services, .about, .portfolio, .cta, .contact, .footer, .service-card, .portfolio-card"
    );

    if (reducedMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("active"));
    } else {
        revealItems.forEach((item, index) => {
            item.classList.add("reveal");
            if (item.matches(".service-card, .portfolio-card")) {
                item.style.transitionDelay = `${(index % 3) * 0.12}s`;
            }
        });

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealItems.forEach((item) => observer.observe(item));
    }

    const modal = document.getElementById("contact");
    const modalPanel = modal?.querySelector(".contact-modal-panel");
    let lastFocusedElement = null;

    const openModal = () => {
        if (!modal) return;
        lastFocusedElement = document.activeElement;
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        const closeButton = modal.querySelector(".modal-close");
        closeButton?.focus();
    };

    const closeModal = () => {
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
    };

    // Any existing link/button pointing to #contact opens the popup instead of scrolling.
    document.querySelectorAll('a[href="#contact"]').forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openModal();
        });
    });

    modal?.querySelectorAll("[data-close-modal]").forEach((element) => {
        element.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();

        // Keep keyboard focus inside the popup while it is open.
        if (event.key === "Tab" && modal && !modal.hidden && modalPanel) {
            const focusable = modalPanel.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    const form = document.getElementById("repairForm");
    const message = document.getElementById("formMessage");

    if (form && message) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            if (!window.BENYAMIN_SUPABASE_URL || !window.BENYAMIN_SUPABASE_KEY || !window.supabase) {
                message.className = "error";
                message.textContent = "اتصال سامانه هنوز تنظیم نشده است. لطفاً بعداً دوباره تلاش کنید.";
                return;
            }

            const data = new FormData(form);
            const customerName = String(data.get("customerName") || "").trim();
            const phone = String(data.get("phone") || "").trim();
            const phoneModel = String(data.get("phoneModel") || "").trim();
            const repairType = String(data.get("repairType") || "").trim();
            const description = String(data.get("description") || "").trim();
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton?.textContent;

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "در حال ارسال...";
            }
            message.className = "";
            message.textContent = "";

            try {
                const client = window.supabase.createClient(
                    window.BENYAMIN_SUPABASE_URL,
                    window.BENYAMIN_SUPABASE_KEY
                );
                const { error } = await client.from("repair_requests").insert({
                    customer_name: customerName,
                    phone,
                    device: phoneModel,
                    problem: `نوع تعمیر: ${repairType}\nتوضیحات: ${description}`
                });
                if (error) throw error;

                message.className = "success";
                message.textContent = "درخواست شما با موفقیت ثبت شد. بنیامین برای پیگیری با شما تماس می‌گیرد.";
                form.reset();
            } catch (error) {
                console.error("Repair request submission failed:", error);
                message.className = "error";
                message.textContent = "ارسال درخواست انجام نشد. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText || "ارسال درخواست";
                }
            }
        });
    }

});
