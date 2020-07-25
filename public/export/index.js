const init = async () => {
	const dynamicFieldAddTemplate = $('#dynamic-field-template').content;

	const $exportForm = $('#export-form');
	const $exportDataFormat = $('#export-data-format');

	const $searchForm = $('#search-form');
	const $searchCategoryField = $('#search-category-field');
	const $searchCaseSetField = $('#search-case-set-field');
	const $searchStartDate = $('#search-start-date');
	const $searchEndDate = $('#search-end-date');

	const $dynamicFields = $('.dynamic-fields');

	const $dynamicKeywords = $('#dynamic-keywords');
	const $dynamicKeywordsAdd = $('#dynamic-keywords-add');
	const $keywordsFields = $('#keywords-fields');

	const $ugcColumns = $('#ugc-columns');

	const $results = $('#results');
	const $resultsTable = $('#results-table');

	const ugcColumnsData = await fetch('/api/export/columns').then((c) => c.json());

	ugcColumnsData.forEach((col) => {
		const label = document.createElement('label');
		label.innerHTML = `<input type="checkbox" class="ugc-column" value="${col.id}" />${col.name}`;
		$ugcColumns.appendChild(label);
	});

	const caseSets = await fetch('/api/human-refinement/case-sets').then(c => c.json());

	caseSets.forEach((caseSet, i) => {

		const option = document.createElement('option');
		option.value = caseSet.id;
		option.text = `[${(i + 1)}] ${caseSet.id}`;
		$searchCaseSetField.appendChild(option);

	})

	const exportData = async (params) => {
		window.open(`/api/export/search?` + params.toString(), '_blank');
	};

	const search = (params) => {
		$resultsTable.innerHTML = '';
		params.set('preview', true);
		fetch(`/api/export/search?` + params.toString())
			.then((t) => t.json())
			.then((results) => {
				$results.style.display = 'block';
				if (results.total > 0) {
					results.columns = results.columns.slice(1);
					results.rows = results.rows.map((a) => a.slice(1));

					const tr = document.createElement('tr');
					$resultsTable.appendChild(tr);
					results.columns.forEach((col) => {
						const th = document.createElement('th');
						th.innerText = col;
						tr.appendChild(th);
					});

					results.rows.forEach((row) => {
						const tr = document.createElement('tr');
						$resultsTable.appendChild(tr);
						row.forEach((col) => {
							const td = document.createElement('td');
							if (typeof col === 'object') {
								if (col !== null && col.length > 0) {
									td.innerHTML = `<details><summary>Details</summary><pre>${JSON.stringify(
										col,
										null,
										4
									)}</pre></details>`;
								} else {
									td.innerHTML = 'null';
								}
							} else if (Array.isArray(col) && col.length > 1) {
								td.innerHTML = `<ul>`;
								col.forEach((c) => {
									td.innerHTML += `<li>${c}</li>`;
								});
								td.innerHTML += `</ul>`;
							} else {
								td.innerText = col;
							}
							tr.appendChild(td);
						});
					});
				}
			});
	};

	const compileParams = () => {
		const $fixedColumns = $('.fixed-column:checked');
		const $ugcColumns = $('.ugc-column:checked');
		const params = new URLSearchParams();

		params.set('category', $searchCategoryField.value);
		params.set('caseSetId', $searchCaseSetField.value)
		if ($searchStartDate.value) {
			params.set('startDate', $searchStartDate.value);
		}
		if ($searchEndDate.value) {
			params.set('endDate', $searchEndDate.value);
		}
		if ($fixedColumns) {
			params.set(
				'fixedColumns',
				$fixedColumns.length
					? Array.from($fixedColumns)
							.map((f) => f.value)
							.join(',')
					: $fixedColumns.value
			);
		}

		if ($ugcColumns) {
			params.set(
				'ugcColumns',
				$ugcColumns.length
					? Array.from($ugcColumns)
							.map((f) => f.value)
							.join(',')
					: $ugcColumns.value
			);
		}

		let $activeKeywordsFields = $('.dynamic-field', $keywordsFields);
		if (!NodeList.prototype.isPrototypeOf($activeKeywordsFields)) {
			$activeKeywordsFields = [$activeKeywordsFields];
		}
		if ($dynamicKeywords.checked && $activeKeywordsFields.length > 0) {
			const keywordsFields = Array.from($activeKeywordsFields)
				.map((f) => f.value)
				.join(',');
			params.set('keywordsFields', keywordsFields);
		}

		return params;
	};

	$exportForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const params = compileParams();
		params.set('exportData', $exportDataFormat.value);
		exportData(params);
	});

	$searchForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const params = compileParams();
		window.history.pushState({}, '', `${location.pathname}?${params}`);
		search(params);
	});


	$dynamicFields.addEventListener('click', (e) => {
		if (e.target.classList.contains('dynamic-field-delete')) {
			e.target.parentNode.remove();
		}
	})


	$dynamicKeywordsAdd.addEventListener('click', () => {
		$keywordsFields.appendChild(dynamicFieldAddTemplate.cloneNode(true));
	});

	if (window.location.search) {
		const initialParams = new URLSearchParams(window.location.search);

		$searchCategoryField.value = initialParams.get('category') || 'All';
		$searchStartDate.value = initialParams.get('startDate');
		$searchEndDate.value = initialParams.get('endDate');

		const caseSetId = initialParams.get('caseSetId');
		if(caseSetId) {
			$searchCaseSetField.value = caseSetId;
		}

		const fixedColumns = initialParams.get('fixedColumns');

		if (fixedColumns) {
			fixedColumns.split(',').forEach((f) => {
				const $checkbox = $(`.fixed-column[value=${f}]`);
				$checkbox.checked = true;
			});
		}

		const ugcColumns = initialParams.get('ugcColumns');

		if (ugcColumns) {
			ugcColumns.split(',').forEach((f) => {
				const $checkbox = $(`.ugc-column[value="${f}"]`);
				$checkbox.checked = true;
			});
		}

		const keywordsFields = initialParams.get('keywordsFields');
		if (keywordsFields) {
			$dynamicKeywords.checked = true;
			keywordsFields.split(',').forEach((f) => {
				const keywordsField = dynamicFieldAddTemplate.cloneNode(true);
				$('input', keywordsField).value = f;
				$keywordsFields.appendChild(keywordsField);
			});
		}

		search(initialParams);
	}

	document.querySelector('.loading').classList.remove('loading');
};

window.onload = init;
