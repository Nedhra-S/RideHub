"use strict";
/* RideHub - Join the Club: validated sign-up form + FAQ accordion */
(function () {
    const { $, load, save, toast } = RH;
    RH.init("contact");
    const form = $("#join-form");
    const fields = {
        name: $("#c-name"),
        email: $("#c-email"),
        phone: $("#c-phone"),
        level: $("#c-level"),
        msg: $("#c-msg"),
    };
    const setErr = (id, msg) => {
        $("#e-" + id).textContent = msg;
        const el = fields[id];
        el.setAttribute("aria-invalid", msg ? "true" : "false");
    };
    function validate() {
        let ok = true;
        if (fields.name.value.trim().length < 2) {
            setErr("name", "Please enter your name");
            ok = false;
        }
        else
            setErr("name", "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim())) {
            setErr("email", "Enter a valid email address");
            ok = false;
        }
        else
            setErr("email", "");
        if (fields.phone.value && !/^[0-9+\-\s]{10,14}$/.test(fields.phone.value.trim())) {
            setErr("phone", "Phone must be 10-14 digits");
            ok = false;
        }
        else
            setErr("phone", "");
        if (!fields.level.value) {
            setErr("level", "Choose your riding level");
            ok = false;
        }
        else
            setErr("level", "");
        if (fields.msg.value.trim().length < 10) {
            setErr("msg", "Tell us a little more (min 10 characters)");
            ok = false;
        }
        else
            setErr("msg", "");
        return ok;
    }
    Object.values(fields).forEach((el) => el.addEventListener("blur", () => { if (form.dataset.touched)
        validate(); }));
    const count = $("#msg-count");
    fields.msg.addEventListener("input", () => (count.textContent = `${fields.msg.value.length}/300`));
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        form.dataset.touched = "1";
        if (!validate()) {
            toast("Please fix the highlighted fields");
            return;
        }
        const members = load("members", []);
        members.push({ name: fields.name.value.trim(), email: fields.email.value.trim(), level: fields.level.value, at: new Date().toISOString() });
        save("members", members);
        form.hidden = true;
        const ok = $("#success");
        ok.hidden = false;
        $("#success-name").textContent = fields.name.value.trim().split(" ")[0];
        toast("Welcome to RideHub!");
    });
    // FAQ accordion
    document.querySelectorAll(".faq button").forEach((btn) => {
        btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") === "true";
            btn.setAttribute("aria-expanded", String(!open));
            btn.nextElementSibling.hidden = open;
        });
    });
})();
