export function reserveSidebarSpace(tray) {
	let sidebar = null;

	function update() {
		const currentSidebar = document.getElementById("sidebar");
		if (currentSidebar !== sidebar) {
			sidebar?.classList.remove("dice-tray-sidebar");
			sidebar?.style.removeProperty("--dice-tray-sidebar-height");
			sidebar = currentSidebar;
		}
		if (!sidebar) return;

		const bounds = tray.getBoundingClientRect();
		if (!tray.isConnected || !bounds.height) {
			sidebar.classList.remove("dice-tray-sidebar");
			sidebar.style.removeProperty("--dice-tray-sidebar-height");
			return;
		}

		const gap = Math.max(0, window.innerHeight - bounds.bottom);
		const height = Math.max(0, bounds.top - gap - sidebar.getBoundingClientRect().top);
		sidebar.style.setProperty("--dice-tray-sidebar-height", `${height}px`);
		sidebar.classList.add("dice-tray-sidebar");
	}

	const observer = new ResizeObserver(update);
	observer.observe(tray);
	window.addEventListener("resize", update);
	const hook = Hooks.on("renderSidebar", update);
	update();

	return () => {
		observer.disconnect();
		window.removeEventListener("resize", update);
		Hooks.off("renderSidebar", hook);
		sidebar?.classList.remove("dice-tray-sidebar");
		sidebar?.style.removeProperty("--dice-tray-sidebar-height");
	};
}
