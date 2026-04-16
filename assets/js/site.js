(function () {
	const data = window.SITE_DATA;

	if (!data) {
		return;
	}

	const currentPage = document.body.dataset.page || "home";
	const state = {
		lang: loadLanguage(data.defaultLang || "zh"),
		publicationMode: hasSelectedPublications() ? "selected" : "all"
	};

	const elements = {
		brandMark: document.getElementById("site-brand-mark"),
		brandText: document.getElementById("site-brand-text"),
		navLinks: document.getElementById("nav-links"),
		profilePanel: document.getElementById("profile-panel"),
		contentPanel: document.getElementById("content-panel"),
		footer: document.getElementById("site-footer"),
		langButtons: Array.from(document.querySelectorAll(".lang-button"))
	};

	let revealObserver = null;

	render();
	setupLanguageSwitch();

	function render() {
		updateMeta();
		renderBrand();
		renderNav();
		renderProfile();
		renderContent();
		renderFooter();
		updateLanguageButtons();
		bindPageEvents();
		observeReveals();
	}

	function renderBrand() {
		elements.brandMark.textContent = data.ui.brandMark;
		elements.brandText.textContent = text(data.ui.brandText);
	}

	function renderNav() {
		elements.navLinks.innerHTML = data.ui.pageOrder
			.map(function (key) {
				const page = getPageConfig(key);
				const isActive = key === currentPage;
				return (
					"<a" +
					(isActive ? ' class="is-active" aria-current="page"' : "") +
					' href="' +
					page.path +
					'" data-page="' +
					key +
					'">' +
					text(page.navTitle) +
					"</a>"
				);
			})
			.join("");
	}

	function renderProfile() {
		const badges = (data.profile.badges || [])
			.map(function (item) {
				return '<span class="interest-chip">' + text(item) + "</span>";
			})
			.join("");

		const details = data.profile.details
			.map(function (item) {
				const iconStyle = item.iconStyle || "fas";
				const value = item.href
					? '<a href="' +
					  resolveHref(item.href) +
					  '"' +
					  externalAttrs(item) +
					  ">" +
					  formatText(item.value) +
					  "</a>"
					: formatText(item.value);

				return (
					'<div class="detail-row">' +
					'<span class="detail-icon"><i class="' +
					iconStyle +
					" " +
					item.icon +
					'"></i></span>' +
					"<div>" +
					'<div class="detail-label">' +
					text(item.label) +
					"</div>" +
					'<div class="detail-value">' +
					value +
					"</div>" +
					"</div>" +
					"</div>"
				);
			})
			.join("");

		elements.profilePanel.innerHTML =
			'<div class="profile-card reveal is-visible">' +
			'<img class="profile-portrait" src="' +
			data.profile.avatar +
			'" alt="' +
			data.profile.name +
			' portrait" />' +
			'<div class="profile-position">' +
			text(data.profile.position) +
			"</div>" +
			'<h1 class="profile-name">' +
			data.profile.name +
			"</h1>" +
			'<div class="profile-affiliation">' +
			text(data.profile.affiliation) +
			"</div>" +
			'<div class="profile-copy">' +
			'<p class="profile-statement">' +
			text(data.profile.statement) +
			"</p>" +
			'<p class="profile-availability">' +
			text(data.profile.availability) +
			"</p>" +
			"</div>" +
			(badges ? '<div class="interest-list profile-badges">' + badges + "</div>" : "") +
			'<div class="profile-details">' +
			details +
			"</div>" +
			'<div class="quick-links">' +
			renderButtons(data.profile.links) +
			"</div>" +
			"</div>";
	}

	function renderContent() {
		elements.contentPanel.innerHTML = buildPage();
	}

	function renderFooter() {
		elements.footer.innerHTML =
			'<p class="footer-note">' +
			text(data.footer.note) +
			"</p>" +
			'<p class="footer-note">' +
			text(data.ui.labels.editHint) +
			' <span class="footer-path">' +
			data.footer.contentFile +
			"</span>" +
			"</p>" +
			"<p>" +
			text(data.ui.labels.lastUpdated) +
			"</p>";
	}

	function buildPage() {
		switch (currentPage) {
			case "profile":
				return buildProfilePage();
			case "about":
				return buildAboutPage();
			case "updates":
				return buildUpdatesPage();
			case "publications":
				return buildPublicationsPage();
			case "projects":
				return buildProjectsPage();
			case "experience":
				return buildExperiencePage();
			case "contact":
				return buildContactPage();
			case "home":
			default:
				return buildHomePage();
		}
	}

	function buildHomePage() {
		return [
			renderHomeHero(),
			renderSectionCard({
				kicker: text(data.ui.pages.home.kicker),
				title: text(data.ui.labels.featuredPages),
				description: text(data.ui.labels.featuredPagesDescription),
				body: '<div class="overview-grid">' + renderPageCards() + "</div>"
			}),
			renderSectionCard({
				kicker: text(data.ui.labels.quickFacts),
				title: text(data.ui.labels.selectedPublications) + " / " + text(data.ui.labels.recentUpdates),
				description: text(data.ui.pages.home.teaser),
				body:
					'<div class="dual-grid">' +
					renderSubsectionCard(
						text(data.ui.labels.selectedPublications),
						renderPublicationList(data.publications.filter(isSelected).slice(0, 2), true) +
							renderFooterAction("publications")
					) +
					renderSubsectionCard(
						text(data.ui.labels.recentUpdates),
						renderUpdateTimeline(data.updates.slice(0, 3), true) + renderFooterAction("updates")
					) +
					"</div>"
			}),
			renderSectionCard({
				kicker: text(data.ui.sections.projects.kicker),
				title: text(data.ui.labels.featuredProjects),
				description: text(data.ui.pages.projects.teaser),
				body:
					'<div class="projects-grid">' +
					renderProjectCards(data.projects.slice(0, 3)) +
					"</div>" +
					renderFooterAction("projects")
			}),
			renderSectionCard({
				kicker: text(data.ui.sections.contact.kicker),
				title: text(data.contact.note.title),
				description: text(data.contact.note.copy),
				body:
					'<div class="collaboration-note collaboration-note--soft">' +
					'<div class="hero-pills">' +
					renderPills(data.contact.note.pills) +
					"</div>" +
					'<div class="quick-links">' +
					renderButtons([
						{
							label: data.ui.labels.contactNow,
							href: "#contact",
							icon: "fa-paper-plane",
							style: "primary"
						},
						{
							label: data.ui.labels.seePublications,
							href: "#publications",
							icon: "fa-book-open"
						}
					]) +
					"</div>" +
					"</div>"
			})
		].join("");
	}

	function buildProfilePage() {
		return [
			renderInnerHero("profile", data.profile.bio, data.profile.badges, getPageMetrics("profile"), [
				{
					label: data.ui.labels.seePublications,
					href: "#publications",
					icon: "fa-book-open",
					style: "primary"
				},
				{
					label: data.ui.labels.contactNow,
					href: "#contact",
					icon: "fa-paper-plane",
					style: "ghost"
				}
			]),
			renderSectionCard({
				kicker: text(data.ui.labels.biography),
				title: text(data.ui.labels.quickFacts),
				description: text(getPageConfig("profile").description),
				body:
					'<div class="about-grid">' +
					'<div class="rich-copy">' +
					renderParagraphs(data.profile.bio) +
					"</div>" +
					'<div class="fact-grid">' +
					renderDetailCard(text(data.ui.labels.quickFacts), data.profile.details) +
					renderActionCard(text(data.ui.labels.quickAccess), data.profile.links) +
					"</div>" +
					"</div>"
			}),
			renderSectionCard({
				kicker: text(data.ui.labels.academicSnapshot),
				title: text(data.ui.labels.academicSnapshot),
				description: text(data.profile.statement),
				body: '<div class="metric-grid">' + renderMetricCards(data.hero.snapshots) + "</div>"
			}),
			renderPageNavigator()
		].join("");
	}

	function buildAboutPage() {
		return [
			renderInnerHero("about", data.about.paragraphs, data.about.interests, getPageMetrics("about"), [
				{
					label: data.ui.labels.seePublications,
					href: "#publications",
					icon: "fa-book-open",
					style: "primary"
				},
				{
					label: data.ui.labels.seeProjects,
					href: "#projects",
					icon: "fa-project-diagram"
				}
			]),
			renderSectionCard({
				kicker: text(data.ui.sections.about.kicker),
				title: text(data.ui.sections.about.title),
				description: text(data.ui.sections.about.description),
				body: renderAboutBody()
			}),
			renderPageNavigator()
		].join("");
	}

	function buildUpdatesPage() {
		return [
			renderInnerHero("updates", [data.ui.sections.updates.description], getUpdatePills(), getPageMetrics("updates"), [
				{
					label: data.ui.labels.seeProjects,
					href: "#projects",
					icon: "fa-project-diagram"
				},
				{
					label: data.ui.labels.contactNow,
					href: "#contact",
					icon: "fa-paper-plane",
					style: "ghost"
				}
			]),
			renderSectionCard({
				kicker: text(data.ui.sections.updates.kicker),
				title: text(data.ui.sections.updates.title),
				description: text(data.ui.sections.updates.description),
				body: renderUpdateTimeline(data.updates)
			}),
			renderPageNavigator()
		].join("");
	}

	function buildPublicationsPage() {
		const publications = getVisiblePublications();
		const controls =
			'<div class="publication-toolbar">' +
			'<div class="metric-inline-group">' +
			renderInlineMetric(text(data.ui.labels.totalPublications), String(data.publications.length)) +
			renderInlineMetric(
				text(data.ui.labels.selectedCount),
				String(data.publications.filter(isSelected).length)
			) +
			"</div>" +
			renderPublicationControls() +
			"</div>";

		return [
			renderInnerHero(
				"publications",
				[data.ui.sections.publications.description],
				getPublicationPills(),
				getPageMetrics("publications"),
				[
					{
						label: data.ui.labels.seeProjects,
						href: "#projects",
						icon: "fa-project-diagram"
					},
					{
						label: data.ui.labels.contactNow,
						href: "#contact",
						icon: "fa-paper-plane",
						style: "ghost"
					}
				]
			),
			renderSectionCard({
				kicker: text(data.ui.sections.publications.kicker),
				title: text(data.ui.sections.publications.title),
				description: text(data.ui.sections.publications.description),
				body: controls + '<div class="publication-list">' + renderPublicationList(publications) + "</div>"
			}),
			renderPageNavigator()
		].join("");
	}

	function buildProjectsPage() {
		return [
			renderInnerHero("projects", [data.ui.sections.projects.description], getProjectPills(), getPageMetrics("projects"), [
				{
					label: data.ui.labels.seePublications,
					href: "#publications",
					icon: "fa-book-open",
					style: "primary"
				},
				{
					label: data.ui.labels.contactNow,
					href: "#contact",
					icon: "fa-paper-plane"
				}
			]),
			renderSectionCard({
				kicker: text(data.ui.sections.projects.kicker),
				title: text(data.ui.sections.projects.title),
				description: text(data.ui.sections.projects.description),
				body: '<div class="projects-grid">' + renderProjectCards(data.projects) + "</div>"
			}),
			renderPageNavigator()
		].join("");
	}

	function buildExperiencePage() {
		return [
			renderInnerHero(
				"experience",
				[data.ui.sections.experience.description],
				[
					data.ui.labels.experience,
					data.ui.labels.education,
					data.ui.labels.honors
				],
				getPageMetrics("experience"),
				[
					{
						label: data.ui.labels.seeProjects,
						href: "#projects",
						icon: "fa-project-diagram"
					},
					{
						label: data.ui.labels.contactNow,
						href: "#contact",
						icon: "fa-paper-plane",
						style: "ghost"
					}
				]
			),
			renderSectionCard({
				kicker: text(data.ui.sections.experience.kicker),
				title: text(data.ui.sections.experience.title),
				description: text(data.ui.sections.experience.description),
				body: renderExperienceBody()
			}),
			renderPageNavigator()
		].join("");
	}

	function buildContactPage() {
		return [
			renderInnerHero("contact", [data.ui.sections.contact.description], data.contact.note.pills, getPageMetrics("contact"), [
				{
					label: data.ui.labels.seePublications,
					href: "#publications",
					icon: "fa-book-open"
				},
				{
					label: data.ui.labels.backHome,
					href: "index.html",
					icon: "fa-arrow-left",
					style: "ghost"
				}
			]),
			renderSectionCard({
				kicker: text(data.ui.sections.contact.kicker),
				title: text(data.ui.sections.contact.title),
				description: text(data.ui.sections.contact.description),
				body: renderContactBody()
			}),
			renderPageNavigator()
		].join("");
	}

	function renderHomeHero() {
		return (
			'<section class="hero-card page-hero reveal">' +
			'<div class="hero-grid">' +
			"<div>" +
			'<div class="hero-eyebrow">' +
			text(data.hero.eyebrow) +
			"</div>" +
			'<h2 class="hero-title">' +
			text(data.hero.title) +
			"</h2>" +
			'<div class="hero-summary">' +
			renderParagraphs(data.hero.summary) +
			"</div>" +
			'<div class="hero-pills">' +
			renderPills(data.hero.pills) +
			"</div>" +
			'<div class="hero-actions">' +
			renderButtons(data.hero.actions) +
			"</div>" +
			"</div>" +
			'<div class="hero-side">' +
			renderMetricCards(data.hero.snapshots) +
			"</div>" +
			"</div>" +
			"</section>"
		);
	}

	function renderInnerHero(pageKey, summaryItems, pills, metrics, actions) {
		const page = getPageConfig(pageKey);
		const metricBlock = metrics && metrics.length ? '<div class="hero-side">' + renderMetricCards(metrics) + "</div>" : "";
		return (
			'<section class="hero-card page-hero reveal">' +
			'<div class="hero-grid hero-grid--inner">' +
			"<div>" +
			'<div class="hero-eyebrow">' +
			text(page.kicker) +
			"</div>" +
			'<h2 class="hero-title hero-title--inner">' +
			text(page.title) +
			"</h2>" +
			'<div class="hero-summary">' +
			renderParagraphs(summaryItems) +
			"</div>" +
			(pills && pills.length ? '<div class="hero-pills">' + renderPills(pills) + "</div>" : "") +
			(actions && actions.length ? '<div class="hero-actions">' + renderButtons(actions) + "</div>" : "") +
			"</div>" +
			metricBlock +
			"</div>" +
			"</section>"
		);
	}

	function renderSectionCard(options) {
		return (
			'<section class="content-section reveal">' +
			renderSectionHeader(options.kicker, options.title, options.description, options.aside) +
			(options.body || "") +
			"</section>"
		);
	}

	function renderSectionHeader(kicker, title, description, aside) {
		return (
			'<div class="section-header">' +
			'<div class="section-heading">' +
			(kicker ? '<div class="section-kicker">' + kicker + "</div>" : "") +
			(title ? '<h2 class="section-title">' + title + "</h2>" : "") +
			(description ? '<p class="section-description">' + description + "</p>" : "") +
			"</div>" +
			(aside || "") +
			"</div>"
		);
	}

	function renderAboutBody() {
		return (
			'<div class="about-grid">' +
			'<div class="rich-copy">' +
			renderParagraphs(data.about.paragraphs) +
			'<div class="interest-block">' +
			'<h3 class="subheading">' +
			text(data.ui.labels.interests) +
			"</h3>" +
			'<div class="interest-list">' +
			renderPills(data.about.interests, "interest-chip") +
			"</div>" +
			"</div>" +
			"</div>" +
			"<div>" +
			'<h3 class="subheading">' +
			text(data.ui.labels.focusAreas) +
			"</h3>" +
			'<div class="focus-grid">' +
			renderFocusCards(data.about.focusCards) +
			"</div>" +
			"</div>" +
			"</div>"
		);
	}

	function renderExperienceBody() {
		const honorsBlock =
			data.honors && data.honors.length
				? '<div class="subsection-card honors-section"><h3 class="subsection-card-title">' +
				  text(data.ui.labels.honors) +
				  '</h3><div class="honor-grid">' +
				  renderHonors(data.honors) +
				  "</div></div>"
				: "";

		return (
			'<div class="dual-grid">' +
			renderSubsectionCard(text(data.ui.labels.experience), renderTimeline(data.experience)) +
			renderSubsectionCard(text(data.ui.labels.education), renderTimeline(data.education)) +
			"</div>" +
			honorsBlock
		);
	}

	function renderContactBody() {
		return (
			'<div class="contact-grid">' +
			renderContactCards(data.contact.items) +
			"</div>" +
			'<div class="collaboration-note">' +
			"<h3>" +
			text(data.contact.note.title) +
			"</h3>" +
			"<p>" +
			text(data.contact.note.copy) +
			"</p>" +
			'<div class="hero-pills">' +
			renderPills(data.contact.note.pills) +
			"</div>" +
			"</div>"
		);
	}

	function renderPageCards() {
		return data.ui.pageOrder
			.filter(function (key) {
				return key !== "home";
			})
			.map(function (key) {
				const page = getPageConfig(key);
				return (
					'<article class="page-card">' +
					'<div class="page-card-header">' +
					'<span class="detail-icon"><i class="fas ' +
					page.icon +
					'"></i></span>' +
					'<span class="page-card-meta">' +
					text(page.navTitle) +
					"</span>" +
					"</div>" +
					'<h3 class="page-card-title">' +
					text(page.title) +
					"</h3>" +
					'<p class="page-card-copy">' +
					text(page.teaser || page.description) +
					"</p>" +
					'<div class="page-card-footer">' +
					'<a class="text-link" href="' +
					page.path +
					'"><span>' +
					text(data.ui.labels.openPage) +
					'</span><i class="fas fa-arrow-right"></i></a>' +
					"</div>" +
					"</article>"
				);
			})
			.join("");
	}

	function renderFocusCards(items) {
		return items
			.map(function (item) {
				return (
					'<article class="focus-card">' +
					'<h3 class="focus-card-title">' +
					text(item.title) +
					"</h3>" +
					'<p class="focus-card-copy">' +
					text(item.copy) +
					"</p>" +
					"</article>"
				);
			})
			.join("");
	}

	function renderUpdateTimeline(items, compact) {
		return (
			'<div class="timeline">' +
			items
				.map(function (item) {
					return (
						'<div class="timeline-item">' +
						'<article class="timeline-card">' +
						'<div class="timeline-date">' +
						'<span class="badge">' +
						text(item.tag) +
						"</span>" +
						"<span>" +
						item.date +
						"</span>" +
						"</div>" +
						'<h3 class="timeline-title">' +
						text(item.title) +
						"</h3>" +
						'<p class="timeline-copy">' +
						text(item.copy) +
						"</p>" +
						(compact ? "" : "") +
						"</article>" +
						"</div>"
					);
				})
				.join("") +
			"</div>"
		);
	}

	function renderPublicationList(items, compact) {
		return items
			.map(function (item) {
				const tags = item.tags && item.tags.length
					? '<div class="tag-list">' +
					  item.tags
							.map(function (tag) {
								return '<span class="tag">' + tag + "</span>";
							})
							.join("") +
					  "</div>"
					: "";
				const links = item.links && item.links.length
					? '<div class="link-list">' + renderInlineLinks(item.links) + "</div>"
					: "";
				return (
					'<article class="publication-card">' +
					'<div class="publication-top">' +
					"<div>" +
					'<div class="meta-row">' +
					'<span class="badge">' +
					text(item.type) +
					"</span>" +
					"<span>" +
					item.year +
					"</span>" +
					"</div>" +
					'<h3 class="publication-title">' +
					text(item.title) +
					"</h3>" +
					"</div>" +
					(item.selected
						? '<span class="badge">' + text(data.ui.publicationFilters.selected) + "</span>"
						: "") +
					"</div>" +
					'<p class="publication-authors">' +
					item.authors +
					"</p>" +
					'<p class="publication-venue">' +
					text(item.venue) +
					"</p>" +
					(compact ? "" : '<p class="publication-note">' + text(item.note) + "</p>") +
					tags +
					links +
					"</article>"
				);
			})
			.join("");
	}

	function renderProjectCards(items) {
		return items
			.map(function (item) {
				const points = item.points && item.points.length
					? '<ul class="project-points">' +
					  item.points
							.map(function (point) {
								return "<li>" + text(point) + "</li>";
							})
							.join("") +
					  "</ul>"
					: "";
				const tags = item.tags && item.tags.length
					? '<div class="tag-list">' +
					  item.tags
							.map(function (tag) {
								return '<span class="tag">' + tag + "</span>";
							})
							.join("") +
					  "</div>"
					: "";
				const links = item.links && item.links.length
					? '<div class="link-list">' + renderInlineLinks(item.links) + "</div>"
					: "";

				return (
					'<article class="project-card">' +
					'<div class="meta-row"><span>' +
					item.period +
					"</span></div>" +
					'<h3 class="project-title">' +
					text(item.title) +
					"</h3>" +
					'<p class="project-role">' +
					text(item.role) +
					"</p>" +
					'<p class="project-description">' +
					text(item.description) +
					"</p>" +
					points +
					tags +
					links +
					"</article>"
				);
			})
			.join("");
	}

	function renderTimeline(items) {
		return (
			'<div class="timeline">' +
			items
				.map(function (item) {
					const points = item.points && item.points.length
						? '<ul class="timeline-points">' +
						  item.points
								.map(function (point) {
									return "<li>" + text(point) + "</li>";
								})
								.join("") +
						  "</ul>"
						: "";
					return (
						'<div class="timeline-item">' +
						'<article class="timeline-card">' +
						'<div class="timeline-date">' +
						"<span>" +
						item.period +
						"</span>" +
						(item.location ? "<span>" + text(item.location) + "</span>" : "") +
						"</div>" +
						'<h3 class="timeline-title">' +
						text(item.title) +
						"</h3>" +
						'<p class="timeline-copy">' +
						text(item.organization) +
						"</p>" +
						points +
						"</article>" +
						"</div>"
					);
				})
				.join("") +
			"</div>"
		);
	}

	function renderHonors(items) {
		return items
			.map(function (item) {
				return (
					'<article class="honor-card">' +
					'<div class="honor-year">' +
					item.year +
					"</div>" +
					'<h3 class="honor-title">' +
					text(item.title) +
					"</h3>" +
					'<p class="timeline-copy">' +
					text(item.copy) +
					"</p>" +
					"</article>"
				);
			})
			.join("");
	}

	function renderContactCards(items) {
		return items
			.map(function (item) {
				const tagName = item.href ? "a" : "div";
				const iconStyle = item.iconStyle || "fas";
				const hrefAttr = item.href
					? ' href="' + resolveHref(item.href) + '"' + externalAttrs(item)
					: "";

				return (
					"<" +
					tagName +
					' class="contact-card"' +
					hrefAttr +
					">" +
					'<div class="meta-row">' +
					'<span class="badge"><i class="' +
					iconStyle +
					" " +
					item.icon +
					'"></i></span>' +
					"</div>" +
					'<div class="contact-label">' +
					text(item.label) +
					"</div>" +
					'<div class="contact-value">' +
					formatText(item.value) +
					"</div>" +
					'<p class="contact-description">' +
					text(item.description) +
					"</p>" +
					"</" +
					tagName +
					">"
				);
			})
			.join("");
	}

	function renderButtons(items) {
		return items
			.map(function (item) {
				const iconStyle = item.iconStyle || "fas";
				const classes = ["button-link"];
				if (item.style === "primary") {
					classes.push("is-primary");
				}
				if (item.style === "ghost") {
					classes.push("is-ghost");
				}

				return (
					'<a class="' +
					classes.join(" ") +
					'" href="' +
					resolveHref(item.href) +
					'"' +
					externalAttrs(item) +
					">" +
					'<span class="button-icon"><i class="' +
					iconStyle +
					" " +
					item.icon +
					'"></i></span>' +
					"<span>" +
					text(item.label) +
					"</span>" +
					'<span class="button-arrow"><i class="fas fa-arrow-right"></i></span>' +
					"</a>"
				);
			})
			.join("");
	}

	function renderInlineLinks(items) {
		return items
			.map(function (item) {
				const iconStyle = item.iconStyle || "fas";
				return (
					'<a class="text-link" href="' +
					resolveHref(item.href) +
					'"' +
					externalAttrs(item) +
					">" +
					'<span>' +
					formatText(item.label) +
					"</span>" +
					'<i class="' +
					iconStyle +
					" " +
					(item.icon || "fa-link") +
					'"></i>' +
					"</a>"
				);
			})
			.join("");
	}

	function renderFooterAction(pageKey) {
		const page = getPageConfig(pageKey);
		return (
			'<div class="section-footer-action">' +
			'<a class="text-link" href="' +
			page.path +
			'"><span>' +
			text(data.ui.labels.viewAll) +
			"</span><i class=\"fas fa-arrow-right\"></i></a>" +
			"</div>"
		);
	}

	function renderSubsectionCard(title, body) {
		return (
			'<div class="subsection-card">' +
			'<h3 class="subsection-card-title">' +
			title +
			"</h3>" +
			body +
			"</div>"
		);
	}

	function renderDetailCard(title, items) {
		return (
			'<article class="fact-card">' +
			'<h3 class="fact-title">' +
			title +
			"</h3>" +
			items
				.map(function (item) {
					const value = item.href
						? '<a href="' +
						  resolveHref(item.href) +
						  '"' +
						  externalAttrs(item) +
						  ">" +
						  formatText(item.value) +
						  "</a>"
						: formatText(item.value);
					return (
						'<div class="fact-row">' +
						'<div class="detail-label">' +
						text(item.label) +
						"</div>" +
						'<div class="detail-value">' +
						value +
						"</div>" +
						"</div>"
					);
				})
				.join("") +
			"</article>"
		);
	}

	function renderActionCard(title, items) {
		return (
			'<article class="fact-card">' +
			'<h3 class="fact-title">' +
			title +
			"</h3>" +
			'<div class="fact-actions">' +
			renderButtons(items) +
			"</div>" +
			"</article>"
		);
	}

	function renderMetricCards(items) {
		return items
			.map(function (item) {
				return (
					'<article class="snapshot-card">' +
					'<div class="snapshot-label">' +
					text(item.label) +
					"</div>" +
					'<div class="snapshot-value">' +
					text(item.value) +
					"</div>" +
					(item.description
						? '<div class="snapshot-description">' + text(item.description) + "</div>"
						: "") +
					"</article>"
				);
			})
			.join("");
	}

	function renderInlineMetric(label, value) {
		return (
			'<div class="metric-inline">' +
			'<span class="metric-inline-label">' +
			label +
			"</span>" +
			'<span class="metric-inline-value">' +
			value +
			"</span>" +
			"</div>"
		);
	}

	function renderPublicationControls() {
		const selectedItems = data.publications.filter(isSelected);
		if (!selectedItems.length) {
			return "";
		}

		return (
			'<div class="publication-controls">' +
			renderFilterButton("selected", data.ui.publicationFilters.selected) +
			renderFilterButton("all", data.ui.publicationFilters.all) +
			"</div>"
		);
	}

	function renderFilterButton(mode, label) {
		const isActive = state.publicationMode === mode ? " is-active" : "";
		return (
			'<button class="filter-button' +
			isActive +
			'" type="button" data-mode="' +
			mode +
			'">' +
			text(label) +
			"</button>"
		);
	}

	function renderPageNavigator() {
		const pageIndex = data.ui.pageOrder.indexOf(currentPage);
		if (pageIndex < 0) {
			return "";
		}

		const prev = data.ui.pageOrder[pageIndex - 1];
		const next = data.ui.pageOrder[pageIndex + 1];
		const navTargets = [];

		if (prev) {
			navTargets.push({
				key: prev,
				label: data.ui.labels.previousPage
			});
		}

		if (next) {
			navTargets.push({
				key: next,
				label: data.ui.labels.nextPage
			});
		}

		const cards = navTargets
			.map(function (entry) {
				const page = getPageConfig(entry.key);
				return (
					'<a class="page-nav-card" href="' +
					page.path +
					'">' +
					'<div class="detail-label">' +
					text(entry.label) +
					"</div>" +
					'<h3 class="page-card-title">' +
					text(page.navTitle) +
					"</h3>" +
					'<p class="page-card-copy">' +
					text(page.teaser || page.description) +
					"</p>" +
					'<span class="text-link">' +
					text(data.ui.labels.openPage) +
					' <i class="fas fa-arrow-right"></i></span>' +
					"</a>"
				);
			})
			.join("");

		if (!cards) {
			return "";
		}

		return renderSectionCard({
			kicker: text(data.ui.labels.pageNavigator),
			title: text(data.ui.labels.pageNavigator),
			description: text(data.ui.labels.pageNavigatorDescription),
			body: '<div class="navigator-grid">' + cards + "</div>"
		});
	}

	function bindPageEvents() {
		Array.from(document.querySelectorAll(".filter-button")).forEach(function (button) {
			button.addEventListener("click", function () {
				state.publicationMode = button.dataset.mode;
				render();
			});
		});
	}

	function observeReveals() {
		const revealNodes = Array.from(document.querySelectorAll(".reveal"));

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) {
			revealNodes.forEach(function (element) {
				element.classList.add("is-visible");
			});
			return;
		}

		if (!revealObserver) {
			revealObserver = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							entry.target.classList.add("is-visible");
							revealObserver.unobserve(entry.target);
						}
					});
				},
				{
					threshold: 0.14
				}
			);
		}

		revealNodes.forEach(function (element) {
			if (!element.classList.contains("is-visible")) {
				revealObserver.observe(element);
			}
		});
	}

	function updateMeta() {
		const page = getPageConfig(currentPage);
		const title = currentPage === "home" ? text(data.seo.title) : text(page.title) + " | " + data.profile.name;
		const description =
			currentPage === "home"
				? text(data.seo.description)
				: text(page.description || page.teaser || data.seo.description);

		document.title = title;
		document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";

		const descriptionMeta = document.querySelector('meta[name="description"]');
		if (descriptionMeta) {
			descriptionMeta.setAttribute("content", description);
		}
	}

	function updateLanguageButtons() {
		elements.langButtons.forEach(function (button) {
			const active = button.dataset.lang === state.lang;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-pressed", String(active));
		});
	}

	function setupLanguageSwitch() {
		elements.langButtons.forEach(function (button) {
			button.addEventListener("click", function () {
				if (button.dataset.lang === state.lang) {
					return;
				}

				state.lang = button.dataset.lang;
				saveLanguage(state.lang);
				render();
			});
		});
	}

	function getPageConfig(key) {
		const page = data.ui.pages[key] || {};
		const section = data.ui.sections[key] || {};
		return {
			path: page.path || (key === "home" ? "index.html" : key + ".html"),
			icon: page.icon || "fa-file-alt",
			navTitle: page.navTitle || page.title || section.title || key,
			kicker: page.kicker || section.kicker || page.navTitle || key,
			title: page.title || section.title || page.navTitle || key,
			description: page.description || section.description || page.teaser || data.seo.description,
			teaser: page.teaser || page.description || section.description || data.seo.description
		};
	}

	function getPageMetrics(pageKey) {
		switch (pageKey) {
			case "profile":
				return data.hero.snapshots.slice(0, 3);
			case "about":
				return [
					{
						label: data.ui.labels.interests,
						value: String(data.about.interests.length),
						description: {
							zh: "可快速概览你当前的研究方向分布。",
							en: "A quick count of your current interest areas."
						}
					},
					{
						label: data.ui.labels.focusAreas,
						value: String(data.about.focusCards.length),
						description: {
							zh: "用更结构化的方式描述你的方法论与主题。",
							en: "Structured cards for your themes and methods."
						}
					}
				];
			case "updates":
				return [
					{
						label: data.ui.labels.updateCount,
						value: String(data.updates.length),
						description: {
							zh: "展示持续积累的研究过程。",
							en: "Shows ongoing momentum over time."
						}
					},
					{
						label: data.ui.labels.latestUpdate,
						value: data.updates[0] ? data.updates[0].date : "-",
						description: {
							zh: "最新动态可以放论文、项目或申请进展。",
							en: "Your latest item can track papers, projects, or applications."
						}
					}
				];
			case "publications":
				return [
					{
						label: data.ui.labels.totalPublications,
						value: String(data.publications.length),
						description: {
							zh: "包括论文、报告、预印本和综述。",
							en: "Includes papers, reports, preprints, and surveys."
						}
					},
					{
						label: data.ui.labels.selectedCount,
						value: String(data.publications.filter(isSelected).length),
						description: {
							zh: "可以挑选最希望别人先看到的条目。",
							en: "Highlight the items you most want people to see first."
						}
					}
				];
			case "projects":
				return [
					{
						label: data.ui.labels.projectCount,
						value: String(data.projects.length),
						description: {
							zh: "适合收纳研究原型、课程作品与工程项目。",
							en: "A place for prototypes, course work, and engineering projects."
						}
					},
					{
						label: data.ui.labels.focusAreas,
						value: String(uniqueProjectTags().length),
						description: {
							zh: "标签可以帮助别人快速理解项目类型。",
							en: "Tags help visitors understand project themes quickly."
						}
					}
				];
			case "experience":
				return [
					{
						label: data.ui.labels.experienceCount,
						value: String(data.experience.length),
						description: {
							zh: "研究与实习经历可以按时间线组织。",
							en: "Research and internship experience can be organized chronologically."
						}
					},
					{
						label: data.ui.labels.honorCount,
						value: String(data.honors.length),
						description: {
							zh: "把奖项和社区参与也纳入成长轨迹。",
							en: "Honors and community work also belong in your trajectory."
						}
					}
				];
			case "contact":
				return [
					{
						label: data.ui.labels.quickAccess,
						value: String(data.contact.items.length),
						description: {
							zh: "保留最常用的联系入口即可。",
							en: "Keep only the contact methods you actually want to use."
						}
					},
					{
						label: data.ui.labels.interests,
						value: String(data.contact.note.pills.length),
						description: {
							zh: "明确写出你愿意交流的话题。",
							en: "State the topics you are open to discussing."
						}
					}
				];
			default:
				return [];
		}
	}

	function getUpdatePills() {
		return data.updates.slice(0, 4).map(function (item) {
			return item.tag;
		});
	}

	function getPublicationPills() {
		return data.publications.slice(0, 4).map(function (item) {
			return item.type;
		});
	}

	function getProjectPills() {
		return uniqueProjectTags().slice(0, 5);
	}

	function uniqueProjectTags() {
		const seen = {};
		data.projects.forEach(function (item) {
			(item.tags || []).forEach(function (tag) {
				seen[tag] = true;
			});
		});
		return Object.keys(seen);
	}

	function getVisiblePublications() {
		if (state.publicationMode === "selected" && data.publications.some(isSelected)) {
			return data.publications.filter(isSelected);
		}

		return data.publications;
	}

	function isSelected(item) {
		return !!item.selected;
	}

	function renderParagraphs(items) {
		if (!items) {
			return "";
		}

		const list = Array.isArray(items) ? items : [items];
		return list
			.map(function (item) {
				return "<p>" + text(item) + "</p>";
			})
			.join("");
	}

	function renderPills(items, className) {
		const pillClass = className || "pill";
		return (items || [])
			.map(function (item) {
				return '<span class="' + pillClass + '">' + text(item) + "</span>";
			})
			.join("");
	}

	function resolveHref(href) {
		const map = {
			"#top": "index.html",
			"#profile": "profile.html",
			"#about": "about.html",
			"#updates": "updates.html",
			"#publications": "publications.html",
			"#projects": "projects.html",
			"#experience": "experience.html",
			"#contact": "contact.html"
		};

		return map[href] || href;
	}

	function text(value) {
		if (typeof value === "string") {
			return value;
		}

		if (!value) {
			return "";
		}

		return value[state.lang] || value.zh || value.en || "";
	}

	function formatText(value) {
		if (typeof value === "string") {
			return value;
		}

		return text(value);
	}

	function externalAttrs(item) {
		return item && item.external ? ' target="_blank" rel="noreferrer"' : "";
	}

	function loadLanguage(fallback) {
		try {
			return localStorage.getItem("homepage-lang") || fallback;
		} catch (error) {
			return fallback;
		}
	}

	function saveLanguage(lang) {
		try {
			localStorage.setItem("homepage-lang", lang);
		} catch (error) {
			return;
		}
	}
})();
