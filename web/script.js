
    // ============================================================
    // 应用主类
    // ============================================================
    class CaseManager {
        constructor() {
            // 标准列定义（与后端一致）
            this.STANDARD_COLS = [
                'ID', '用例编号', '用例标题', '项目','测试类型','测试类别', '场景', '场景图',
                '测试环境', '前置条件', '步骤', '自车速度km/h', '目标速度km/h',
                '目标初始位置距离m','目标类型', 'ADC数据保存位置', '测试结果位置',
                '测试结果', '预期结果', '产品/平台', '版本信息', 
                '重要程度', '优先级', '用例设计方法', '测试方法类型', '备注','标签'];
            this.STANDARD_DISPLAY_COLS = [
                 'ID', '用例编号', '用例标题','项目','测试类型', '场景', '步骤', '场景图',
                 '测试环境', '前置条件'];
            this.LINK_COLS = ['ADC数据保存位置', '测试结果位置'];
            this.URL_SEPARATOR = ';';

            // 可见列（从 localStorage 读取，默认只显示核心列）
            this.visibleColumns = this._loadVisibleColumns();

            // 状态
            this.currentHeaders = [];
            this.currentData = [];
            this.totalRows = 0;
            this.currentPage = 1;
            this.pageSize = 50;
            this.totalPages = 0;
            this.searchConditions = null;
            this.searchLogic = 'and';
            this.groupMode = false;
            this.groupField = '测试类型';   // ★ 默认分组字段
            this.allData = [];
            this.groupCache = {};
            this.editingRowIndex = null;

            // DOM 引用
            this.$ = (s) => document.querySelector(s);
            this.$$ = (s) => document.querySelectorAll(s);

            this.tableContainer = this.$('#tableContainer');
            this.emptyState = this.$('#emptyState');
            this.totalCount = this.$('#totalCount');
            this.emptyIdCount = this.$('#emptyIdCount');
            this.emptyIdStat = this.$('#emptyIdStat');
            this.statusMsg = this.$('#statusMsg');
            this.viewBanner = this.$('#viewBanner');
            this.bannerText = this.$('#bannerText');
            this.bannerCount = this.$('#bannerCount');
            this.bannerResetBtn = this.$('#bannerResetBtn');
            this.searchField = this.$('#searchField');
            this.searchKeyword = this.$('#searchKeyword');
            this.searchBtn = this.$('#searchBtn');
            this.resetSearchBtn = this.$('#resetSearchBtn');
            this.toggleAdvancedBtn = this.$('#toggleAdvancedBtn');
            this.advancedSearch = this.$('#advancedSearch');
            this.conditionsContainer = this.$('#conditionsContainer');
            this.addConditionBtn = this.$('#addConditionBtn');
            this.advancedSearchBtn = this.$('#advancedSearchBtn');
            this.clearConditionsBtn = this.$('#clearConditionsBtn');
            this.pagination = this.$('#pagination');
            this.totalRecordsSpan = this.$('#totalRecords');
            this.currentPageDisplay = this.$('#currentPageDisplay');
            this.totalPagesDisplay = this.$('#totalPagesDisplay');
            this.pageInput = this.$('#pageInput');
            this.pageSizeSelect = this.$('#pageSizeSelect');
            this.firstPageBtn = this.$('#firstPageBtn');
            this.prevPageBtn = this.$('#prevPageBtn');
            this.nextPageBtn = this.$('#nextPageBtn');
            this.lastPageBtn = this.$('#lastPageBtn');
            this.goPageBtn = this.$('#goPageBtn');
            this.groupFieldSelect = this.$('#groupFieldSelect');
            this.toggleGroupBtn = this.$('#toggleGroupBtn');
            this.addRowBtn = this.$('#addRowBtn');
            this.addModal = this.$('#addModal');
            this.addForm = this.$('#addForm');
            this.addCancelBtn = this.$('#addCancelBtn');
            this.addConfirmBtn = this.$('#addConfirmBtn');
            this.editModal = this.$('#editModal');
            this.editForm = this.$('#editForm');
            this.editCancelBtn = this.$('#editCancelBtn');
            this.editConfirmBtn = this.$('#editConfirmBtn');
            this.lightbox = this.$('#lightbox');
            this.lightboxImg = this.$('#lightboxImg');
            this.lightboxClose = this.$('#lightboxClose');
            this.uploadZone = this.$('#uploadZone');
            this.uploadBtn = this.$('#uploadBtn');
            this.fileInput = this.$('#fileInput');
            this.exportBtn = this.$('#exportBtn');
            this.exportExcelBtn = this.$('#exportExcelBtn');
            this.clearBtn = this.$('#clearBtn');
            this.loadSampleBtn = this.$('#loadSampleBtn');
            this.columnSettingsBtn = this.$('#columnSettingsBtn');
            this.columnSettingsModal = this.$('#columnSettingsModal');
            this.columnCheckboxes = this.$('#columnCheckboxes');
            this.columnSettingsCancel = this.$('#columnSettingsCancel');
            this.columnSettingsConfirm = this.$('#columnSettingsConfirm');
            this.toastContainer = this.$('#toastContainer');
            this.selectAllColumnsBtn = this.$('#selectAllColumnsBtn');

            this.init();
        }

        // ---------- 初始化 ----------
        init() {
            this._bindEvents();
            this.loadPage(1, this.pageSize);
            if (this.selectAllColumnsBtn) {
                this.selectAllColumnsBtn.addEventListener('click', () => this._selectAllColumns());
            }
            // 恢复折叠状态
            const collapsed = localStorage.getItem('header_collapsed') === 'true';
            if (collapsed && this.headerCollapsible) {
                this.headerCollapsible.classList.add('collapsed');
                this.toggleHeaderBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                this.toggleHeaderBtn.title = '展开表头区域';
            }
        }

         // ---------- 切换全选/取消全选所有列 ----------
        _selectAllColumns() {
            const checkboxes = this.columnCheckboxes.querySelectorAll('input[type="checkbox"]');
            if (!checkboxes.length) return;

            // 判断当前是否全部已勾选
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const newState = !allChecked; // 切换状态

            checkboxes.forEach(cb => {
                cb.checked = newState;
            });

            // 可选：更新按钮文字
            const btn = this.selectAllColumnsBtn;
            if (btn) {
                btn.innerHTML = newState ?
                    '<i class="fas fa-times"></i> 取消全选' :
                    '<i class="fas fa-check-double"></i> 全选';
            }

            this.showToast(newState ? '已全选所有列' : '已取消全选', 'info');
        }

        // ---------- 可见列管理 ----------
        _loadVisibleColumns() {
            const DEFAULT = this.STANDARD_DISPLAY_COLS;
            try {
                const saved = localStorage.getItem('case_manager_visible_cols');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const filtered = parsed.filter(c => this.STANDARD_COLS.includes(c));
                    if (filtered.length > 0) return filtered;
                }
                return DEFAULT;
            } catch {
                return DEFAULT;
            }
        }

        _saveVisibleColumns() {
            localStorage.setItem('case_manager_visible_cols', JSON.stringify(this.visibleColumns));
        }

        // ---------- Toast ----------
        showToast(msg, type = 'info', duration = 4000) {
            const icons = { info: 'fa-circle-info', success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-triangle-exclamation' };
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
            this.toastContainer.appendChild(toast);
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
        }

        // ---------- 辅助 ----------
        getCaseIdField(headers) {
            if (headers.includes('用例编号')) return '用例编号';
            const candidates = ['用例编号', 'caseid', 'Case ID', '编号'];
            for (const c of candidates) if (headers.includes(c)) return c;
            return null;
        }

        countEmptyIds(headers, data) {
            const idField = this.getCaseIdField(headers);
            if (!idField) return 0;
            let count = 0;
            data.forEach(row => {
                const val = row[idField] !== undefined && row[idField] !== null ? String(row[idField]).trim() : '';
                if (val === '') count++;
            });
            return count;
        }

        isValidUrl(string) {
            try {
                const url = new URL(string);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch { return false; }
        }

        isImageData(val) {
            if (!val) return false;
            const str = String(val);
            return str.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(str);
        }

        // ---------- 更新搜索字段下拉 ----------
        updateSearchFields(headers) {
            const sel = this.searchField;
            sel.innerHTML = '<option value="">选择字段</option>';
            headers.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                sel.appendChild(opt);
            });
        }

        // ---------- 更新分组下拉 ----------
        updateGroupFieldSelect(headers) {
            const sel = this.groupFieldSelect;
            sel.innerHTML = '';
            headers.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                if (h === this.groupField) opt.selected = true;
                sel.appendChild(opt);
            });
            if (!headers.includes(this.groupField) && headers.length > 0) {
                this.groupField = headers[0];
                sel.value = this.groupField;
            }
        }

        // ---------- Banner ----------
        showBanner(text, count) {
            this.viewBanner.classList.add('show');
            this.bannerText.textContent = text;
            this.bannerCount.textContent = count + ' 条';
        }
        hideBanner() {
            this.viewBanner.classList.remove('show');
        }

        // ---------- Lightbox ----------
        openLightbox(src) {
            this.lightboxImg.src = src;
            this.lightbox.classList.add('show');
        }
        closeLightbox() {
            this.lightbox.classList.remove('show');
        }

        // ---------- 数据加载 ----------
        loadPage(page, size) {
            page = parseInt(page) || 1;
            size = parseInt(size) || 50;
            if (page < 1) page = 1;

            const conditions = this.searchConditions;
            const logic = this.searchLogic;

            eel.get_paginated_data(page, size, conditions, logic)((res) => {
                if (res.status === 'success') {
                    this.currentHeaders = res.headers || this.STANDARD_COLS;
                    this.currentData = res.data || [];
                    this.totalRows = res.total || 0;
                    this.currentPage = res.page || 1;
                    this.pageSize = res.page_size || size;
                    this.totalPages = res.total_pages || 0;

                    this._updatePagination();
                    this.updateSearchFields(this.currentHeaders);
                    this.updateGroupFieldSelect(this.currentHeaders);

                    if (this.groupMode && this.currentHeaders.includes(this.groupField)) {
                        this._renderGrouped(this.currentData);
                    } else {
                        this._renderTable(this.currentData);
                    }

                    this._updateStats();

                    if (this.totalRows === 0) {
                        this.emptyState.style.display = 'block';
                        this.pagination.style.display = 'none';
                    } else {
                        this.emptyState.style.display = 'none';
                        this.pagination.style.display = 'flex';
                    }

                    if (this.searchConditions && this.searchConditions.length > 0) {
                        this.showBanner('🔍 搜索', this.totalRows);
                    } else {
                        this.hideBanner();
                    }
                } else {
                    this.showToast('加载数据失败：' + (res.msg || ''), 'error');
                }
            });
        }

        loadAllData() {
            this.tableContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#8a9aa8;"><i class="fas fa-spinner fa-spin"></i> 加载数据中...</div>';
            eel.get_all_data()((res) => {
                if (res.status === 'success') {
                    this.allData = res.data || [];
                    this.currentHeaders = res.headers || this.STANDARD_COLS;
                    this.totalRows = res.total_rows || this.allData.length;
                    this.updateSearchFields(this.currentHeaders);
                    this.updateGroupFieldSelect(this.currentHeaders);
                    this.pagination.style.display = 'none';
                    this._renderGrouped(this.allData);
                    this._updateStats();
                    if (this.totalRows === 0) {
                        this.emptyState.style.display = 'block';
                    } else {
                        this.emptyState.style.display = 'none';
                    }
                    this.hideBanner();
                } else {
                    this.showToast('加载全部数据失败：' + (res.msg || ''), 'error');
                }
            });
        }

        // ---------- 表格渲染 ----------
        _renderTable(data) {
            const visibleHeaders = this.currentHeaders.filter(h => this.visibleColumns.includes(h));
            if (visibleHeaders.length === 0) {
                this.tableContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#8a9aa8;">请通过列显示设置至少显示一列</div>';
                return;
            }
            if (!this.currentHeaders.length || !data || data.length === 0) {
                this.tableContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#8a9aa8;">暂无数据</div>';
                return;
            }

            const startIdx = (this.currentPage - 1) * this.pageSize;
            let html = '<div class="table-scroll-inner" style="overflow-y:auto; max-height:700px;">';
            html += '<table style=" width:100%; border-collapse:collapse;">';
            html += '<thead><tr>';
            visibleHeaders.forEach(h => html += `<th>${h}</th>`);
            html += '<th style="text-align:center;min-width:140px;">操作</th></tr></thead><tbody>';
            data.forEach((row, idx) => {
                const globalIdx = startIdx + idx;
                html += `<tr data-row="${globalIdx}" class="data-row">`;
                visibleHeaders.forEach(h => {
                    const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                    let display = '';
                    if (h === '场景图' && this.isImageData(val)) {
                        display = `<img src="${val}" class="scene-thumb" alt="场景图" title="点击查看大图" data-img="${val}" />`;
                    } else if (this.LINK_COLS.includes(h) && val.trim() !== '') {
                        const urls = val.split(this.URL_SEPARATOR).map(s => s.trim()).filter(s => s);
                        if (urls.length === 0) {
                            display = `<span class="cell-text" title="${val}">${val}</span>`;
                        } else {
                            display = urls.map(url => {
                                if (this.isValidUrl(url)) {
                                    return `<div class="link-item"><a href="${url}" target="_blank" class="cell-link" title="${url}">${url}</a></div>`;
                                } else {
                                    return `<div class="link-item"><span class="cell-text" title="${url}">${url}</span></div>`;
                                }
                            }).join('');
                        }
                    } else {
                        display = `<span class="cell-text" title="${val}">${val}</span>`;
                    }
                    html += `<td>${display}</td>`;
                });
                html += `<td class="td-actions">
                    <button class="btn btn-warning btn-xs edit-row" data-row="${globalIdx}"><i class="fas fa-pen"></i> 编辑</button>
                    <button class="btn btn-danger btn-xs delete-row" data-row="${globalIdx}"><i class="fas fa-times"></i> 删除</button>
                    <button class="btn btn-info btn-xs copy-row" data-row="${globalIdx}"><i class="fas fa-copy"></i> 复制</button>
                </td></tr>`;
            });
            html += '</table></div>';
           
            this.tableContainer.innerHTML = html;
        }

        // ---------- 分组渲染 ----------
        _renderGrouped(data) {
            if (!data || data.length === 0) {
                this.tableContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#8a9aa8;">暂无数据</div>';
                return;
            }
            const field = this.groupField;
            const visibleHeaders = this.currentHeaders.filter(h => this.visibleColumns.includes(h));
            if (visibleHeaders.length === 0) {
                this.tableContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#8a9aa8;">请通过列设置至少显示一列</div>';
                return;
            }

            const groups = {};
            data.forEach(row => {
                const raw = row[field];
                let key = (raw !== undefined && raw !== null && String(raw).trim() !== '') ? String(raw) : '(空值)';
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            this.groupCache = {};
            let html = '';
            for (const [key, rows] of Object.entries(groups)) {
                this.groupCache[key] = { rows, rendered: false, visibleHeaders };
                html += `<div class="group-container" data-group="${key}">
                    <div class="group-header">
                        <div class="group-title">
                            <i class="fas fa-chevron-down"></i>
                            <span>${key}</span>
                            <span style="font-weight:400;font-size:12px;color:#5e7a99;">(${rows.length} 条)</span>
                        </div>
                        <span><i class="fas fa-chevron-down"></i></span>
                    </div>
                    <div class="group-body collapsed" style="max-height:0; overflow:hidden; transition: max-height 0.3s ease;"></div>
                </div>`;
            }
            this.tableContainer.innerHTML = html;
        }

        _renderGroupBody(groupKey) {
            const cache = this.groupCache[groupKey];
            if (!cache || cache.rendered) return;
            const container = document.querySelector(`.group-container[data-group="${groupKey}"]`);
            if (!container) return;
            const body = container.querySelector('.group-body');
            if (!body) return;

            const { rows, visibleHeaders } = cache;
            const rowIndexMap = new Map();
            rows.forEach((row, idx) => rowIndexMap.set(row, idx));

            // ★ 添加滚动容器
            let html = '<div class="table-scroll-inner" style="overflow-y:auto; max-height:700px;">';
            html += '<table style="max-height:700px;width:100%; border-collapse:collapse;">';
            html += '<thead><tr>';
            visibleHeaders.forEach(h => html += `<th>${h}</th>`);
            html += '<th style="text-align:center;min-width:140px;">操作</th></tr></thead><tbody>';
            rows.forEach(row => {
                const globalIdx = rowIndexMap.get(row);
                html += `<tr data-row="${globalIdx}" class="data-row">`;
                visibleHeaders.forEach(h => {
                    const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                    let display = '';
                    if (h === '场景图' && this.isImageData(val)) {
                        display = `<img src="${val}" class="scene-thumb" alt="场景图" title="点击查看大图" data-img="${val}" />`;
                    } else if (this.LINK_COLS.includes(h) && val.trim() !== '') {
                        const urls = val.split(this.URL_SEPARATOR).map(s => s.trim()).filter(s => s);
                        if (urls.length === 0) {
                            display = `<span class="cell-text" title="${val}">${val}</span>`;
                        } else {
                            display = urls.map(url => {
                                if (this.isValidUrl(url)) {
                                    return `<div class="link-item"><a href="${url}" target="_blank" class="cell-link" title="${url}">${url}</a></div>`;
                                } else {
                                    return `<div class="link-item"><span class="cell-text" title="${url}">${url}</span></div>`;
                                }
                            }).join('');
                        }
                    } else {
                        display = `<span class="cell-text" title="${val}">${val}</span>`;
                    }
                    html += `<td>${display}</td>`;
                });
                html += `<td class="td-actions">
                    <button class="btn btn-warning btn-xs edit-row" data-row="${globalIdx}"><i class="fas fa-pen"></i> 编辑</button>
                    <button class="btn btn-danger btn-xs delete-row" data-row="${globalIdx}"><i class="fas fa-times"></i> 删除</button>
                    <button class="btn btn-info btn-xs copy-row" data-row="${globalIdx}"><i class="fas fa-copy"></i> 复制</button>
                </td></tr>`;
            });
            html += '</table></div>';
             // 关闭滚动容器

            body.innerHTML = html;
            cache.rendered = true;
        }

        // ---------- 分页更新 ----------
        _updatePagination() {
            this.totalRecordsSpan.textContent = this.totalRows;
            this.currentPageDisplay.textContent = this.currentPage;
            this.totalPagesDisplay.textContent = this.totalPages;
            this.pageInput.value = this.currentPage;
            this.firstPageBtn.disabled = this.currentPage <= 1;
            this.prevPageBtn.disabled = this.currentPage <= 1;
            this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
            this.lastPageBtn.disabled = this.currentPage >= this.totalPages;
            this.pageSizeSelect.value = this.pageSize;
        }

        goToPage(page) {
            if (page < 1) page = 1;
            if (page > this.totalPages) page = this.totalPages;
            if (page !== this.currentPage) {
                this.loadPage(page, this.pageSize);
            }
        }

        // ---------- 统计 ----------
        _updateStats() {
            this.totalCount.textContent = this.totalRows;
            const emptyCount = this.countEmptyIds(this.currentHeaders, this.currentData);
            if (emptyCount > 0) {
                this.emptyIdStat.style.display = 'flex';
                this.emptyIdCount.textContent = emptyCount;
            } else {
                this.emptyIdStat.style.display = 'none';
            }
            this.statusMsg.textContent = `共 ${this.totalRows} 行`;
        }

        // ---------- 搜索 ----------
        doSimpleSearch() {
            if (this.advancedSearch.style.display !== 'none') {
                this.showToast('请先关闭高级查询或使用高级查询按钮', 'warning');
                return;
            }
            const field = this.searchField.value;
            const keyword = this.searchKeyword.value.trim();
            if (!field) { this.showToast('请选择搜索字段', 'warning'); return; }
            if (!keyword) { this.showToast('请输入关键词', 'warning'); return; }
            this.searchConditions = [{ field, operator: 'contains', value: keyword }];
            this.searchLogic = 'and';
            this.loadPage(1, this.pageSize);
        }

        doAdvancedSearch() {
            const rows = this.conditionsContainer.querySelectorAll('.condition-row');
            const conditions = [];
            rows.forEach(row => {
                const field = row.querySelector('select:first-child').value;
                const operator = row.querySelector('select:nth-child(2)').value;
                const value = row.querySelector('input[type="text"]').value.trim();
                if (field && (operator === 'isnull' || operator === 'notnull' || value)) {
                    conditions.push({ field, operator, value });
                }
            });
            if (conditions.length === 0) {
                this.showToast('请至少填写一个有效条件', 'warning');
                return;
            }
            this.searchConditions = conditions;
            this.searchLogic = document.querySelector('input[name="searchLogic"]:checked').value;
            this.loadPage(1, this.pageSize);
        }

        resetSearch() {
            this.searchKeyword.value = '';
            this.searchField.value = '';
            this.advancedSearch.style.display = 'none';
            this.conditionsContainer.innerHTML = '';
            this.searchConditions = null;
            this.searchLogic = 'and';
            this.hideBanner();
            if (this.groupMode) {
                this.loadAllData();
            } else {
                this.loadPage(1, this.pageSize);
            }
            this.showToast('已重置显示全部数据', 'info');
        }

        // ---------- 新增/编辑 ----------
        _buildImageControl(value = '') {
            const container = document.createElement('div');
            container.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = '场景图';
            container.appendChild(label);

            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.dataset.field = '场景图';
            hidden.value = value || '';
            container.appendChild(hidden);

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.marginBottom = '6px';
            container.appendChild(fileInput);

            const previewDiv = document.createElement('div');
            previewDiv.className = 'file-preview';
            if (value && this.isImageData(value)) {
                const img = document.createElement('img');
                img.src = value;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.cursor = 'pointer';
                img.title = '点击预览大图';
                img.addEventListener('click', () => this.openLightbox(value));
                previewDiv.appendChild(img);
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.textContent = '当前图片 (点击放大)';
                previewDiv.appendChild(nameSpan);
            } else if (value) {
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name';
                nameSpan.textContent = value;
                previewDiv.appendChild(nameSpan);
            }
            container.appendChild(previewDiv);

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                    this.showToast('图片大小超过 5MB，请压缩后重试', 'error');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target.result;
                    hidden.value = dataUrl;
                    previewDiv.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    img.style.cursor = 'pointer';
                    img.title = '点击预览大图';
                    img.addEventListener('click', () => this.openLightbox(dataUrl));
                    previewDiv.appendChild(img);
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'file-name';
                    nameSpan.textContent = file.name + ' (点击放大)';
                    previewDiv.appendChild(nameSpan);
                    this.showToast('图片已加载，可点击预览', 'success');
                };
                reader.onerror = () => this.showToast('读取图片失败', 'error');
                reader.readAsDataURL(file);
            });
            return container;
        }

        _buildFormFields(fields, data = {}) {
            const container = document.createElement('div');
            fields.forEach(field => {
                if (field === 'ID') {
                    // ID 隐藏，由后端生成
                    const hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.dataset.field = 'ID';
                    hidden.value = data['ID'] || '';
                    container.appendChild(hidden);
                    return;
                }
                if (field === '场景图') {
                    const control = this._buildImageControl(data['场景图'] || '');
                    container.appendChild(control);
                    return;
                }
                const group = document.createElement('div');
                group.className = 'form-group';
                const label = document.createElement('label');
                label.textContent = field;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = data[field] || '';
                input.dataset.field = field;
                if (field === 'ID') input.readOnly = true;
                group.appendChild(label);
                group.appendChild(input);
                if (this.LINK_COLS.includes(field)) {
                    const hint = document.createElement('div');
                    hint.className = 'field-hint';
                    hint.textContent = '多个链接请用分号 ; 分隔';
                    group.appendChild(hint);
                }
                container.appendChild(group);
            });
            return container;
        }

        _collectFormData(container) {
            const rowData = {};
            const groups = container.querySelectorAll('.form-group');
            groups.forEach(group => {
                const hidden = group.querySelector('input[type="hidden"]');
                if (hidden) {
                    rowData[hidden.dataset.field] = hidden.value;
                } else {
                    const input = group.querySelector('input[type="text"]');
                    if (input) {
                        rowData[input.dataset.field] = input.value.trim();
                    }
                }
            });
            // 确保场景图存在
            if (!rowData.hasOwnProperty('场景图')) rowData['场景图'] = '';
            return rowData;
        }

        openAddModal() {
            if (!this.currentHeaders.length) {
                this.showToast('请先导入数据以确定列结构', 'warning');
                return;
            }
            this.addForm.innerHTML = '';
            const form = this._buildFormFields(this.currentHeaders);
            this.addForm.appendChild(form);
            this.addModal.classList.add('show');
            this.addConfirmBtn.disabled = false;
            this.addConfirmBtn.innerHTML = '确认新增';
        }

        closeAddModal() {
            this.addModal.classList.remove('show');
        }

        confirmAddRow() {
            const rowData = this._collectFormData(this.addForm);
            this.addConfirmBtn.disabled = true;
            this.addConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 新增中...';
            eel.add_row(rowData)((res) => {
                this.addConfirmBtn.disabled = false;
                this.addConfirmBtn.innerHTML = '确认新增';
                if (res.status === 'success') {
                    this.closeAddModal();
                    if (this.groupMode) this.loadAllData();
                    else this.loadPage(1, this.pageSize);
                    this.showToast('新增用例成功 ✅', 'success');
                } else {
                    this.showToast('新增失败：' + res.msg, 'error');
                }
            });
        }

        openEditModal(rowIdx) {
            let row;
            if (this.groupMode) {
                row = this.allData.find((item, idx) => idx === rowIdx);
                if (!row) {
                    this.showToast('未找到该行数据', 'error');
                    return;
                }
            } else {
                const localIdx = rowIdx - (this.currentPage - 1) * this.pageSize;
                if (localIdx < 0 || localIdx >= this.currentData.length) {
                    this.showToast('行索引无效', 'error');
                    return;
                }
                row = this.currentData[localIdx];
            }
            if (!row) {
                this.showToast('未找到该行数据', 'error');
                return;
            }
            this.editingRowIndex = rowIdx;
            this.editForm.innerHTML = '';
            const form = this._buildFormFields(this.currentHeaders, row);
            this.editForm.appendChild(form);
            this.editModal.classList.add('show');
            this.editConfirmBtn.disabled = false;
            this.editConfirmBtn.innerHTML = '保存修改';
        }

        closeEditModal() {
            this.editModal.classList.remove('show');
            this.editingRowIndex = null;
        }

        confirmEditRow() {
            if (this.editingRowIndex === null) return;
            const rowData = this._collectFormData(this.editForm);
            this.editConfirmBtn.disabled = true;
            this.editConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
            eel.update_row(this.editingRowIndex, rowData)((res) => {
                this.editConfirmBtn.disabled = false;
                this.editConfirmBtn.innerHTML = '保存修改';
                if (res.status === 'success') {
                    this.closeEditModal();
                    if (this.groupMode) this.loadAllData();
                    else this.loadPage(this.currentPage, this.pageSize);
                    this.showToast(`第 ${this.editingRowIndex+1} 行修改成功 ✅`, 'success');
                } else {
                    this.showToast('修改失败：' + res.msg, 'error');
                }
            });
        }

        // ---------- 导入 ----------
        importFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < uint8Array.length; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                const base64 = btoa(binary);
                const modeRadio = document.querySelector('input[name="importMode"]:checked');
                const mode = modeRadio ? modeRadio.value : 'append';
                this.showToast('正在导入...', 'info');
                eel.import_csv_from_content(base64, file.name, mode)((res) => {
                    if (res.status === 'success') {
                        this.searchConditions = null;
                        this.searchLogic = 'and';
                        if (this.groupMode) this.loadAllData();
                        else this.loadPage(1, this.pageSize);
                        this.showToast(`成功导入 ${res.total_rows || '?'} 行数据 ✅`, 'success');
                    } else {
                        this.showToast('导入失败：' + res.msg, 'error');
                    }
                });
            };
            reader.onerror = () => this.showToast('读取文件失败', 'error');
            reader.readAsArrayBuffer(file);
        }

        // ---------- 导出 ----------
        exportCsv() {
            eel.export_csv_to_web()((res) => {
                if (res.status === 'success') {
                    this.showToast(`CSV 已保存到 web/${res.filename} ✅`, 'success');
                } else {
                    this.showToast('导出失败：' + res.msg, 'error');
                }
            });
        }

        exportExcel() {
            eel.export_excel_with_images()((res) => {
                if (res.status === 'success') {
                    this.showToast('Excel 已保存到 web 文件夹：' + res.filepath, 'success');
                } else {
                    this.showToast('导出失败：' + res.msg, 'error');
                }
            });
        }

        // ---------- 列显示设置 ----------
        renderColumnSettings() {
            this.columnCheckboxes.innerHTML = '';
            this.STANDARD_COLS.forEach(col => {
                const label = document.createElement('label');
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '6px';
                label.style.cursor = 'pointer';
                label.style.fontSize = '13px';
                label.style.margin = '4px 0';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = col;
                cb.checked = this.visibleColumns.includes(col);
                label.appendChild(cb);
                label.appendChild(document.createTextNode(col));
                this.columnCheckboxes.appendChild(label);
            });
        }

        openColumnSettings() {
            this.renderColumnSettings();
            this.columnSettingsModal.style.display = 'flex';
        }

        closeColumnSettings() {
            this.columnSettingsModal.style.display = 'none';
        }

        confirmColumnSettings() {
            const checkboxes = this.columnCheckboxes.querySelectorAll('input[type="checkbox"]');
            const newVisible = [];
            checkboxes.forEach(cb => { if (cb.checked) newVisible.push(cb.value); });
            if (newVisible.length === 0) {
                this.showToast('请至少选择一列', 'warning');
                return;
            }
            this.visibleColumns = newVisible;
            this._saveVisibleColumns();
            this.closeColumnSettings();
            if (this.groupMode) this.loadAllData();
            else this.loadPage(this.currentPage, this.pageSize);
            this.showToast('列显示设置已更新', 'success');
        }

        // ---------- 事件绑定 ----------
        _bindEvents() {
            // 表格事件委托
            this.tableContainer.addEventListener('click', (e) => {
                // 复制按钮
                const copyBtn = e.target.closest('.copy-row');
                if (copyBtn) {
                    const rowIdx = parseInt(copyBtn.dataset.row);
                    this._copyRowToClipboard(rowIdx);
                    return;
                }
                // 分组折叠/展开
                const groupHeader = e.target.closest('.group-header');
                if (groupHeader) {
                    const container = groupHeader.closest('.group-container');
                    const groupKey = container.dataset.group;
                    const body = container.querySelector('.group-body');
                    const icon = groupHeader.querySelector('.group-title i');
                    if (!groupKey || !body) return;
                    const isCollapsed = body.classList.contains('collapsed');
                    if (isCollapsed) {
                        if (!this.groupCache[groupKey] || !this.groupCache[groupKey].rendered) {
                            this._renderGroupBody(groupKey);
                        }
                        body.classList.remove('collapsed');
                        body.style.maxHeight = body.scrollHeight + 50 + 'px';
                        if (icon) icon.classList.remove('collapsed');
                    } else {
                        body.classList.add('collapsed');
                        body.style.maxHeight = '0';
                        if (icon) icon.classList.add('collapsed');
                    }
                    return;
                }

                // 编辑
                const editBtn = e.target.closest('.edit-row');
                if (editBtn) {
                    const rowIdx = parseInt(editBtn.dataset.row);
                    this.openEditModal(rowIdx);
                    return;
                }

                // 删除
                const deleteBtn = e.target.closest('.delete-row');
                if (deleteBtn) {
                    const rowIdx = parseInt(deleteBtn.dataset.row);
                    if (confirm(`确定删除第 ${rowIdx+1} 行？`)) {
                        eel.delete_row(rowIdx)((res) => {
                            if (res.status === 'success') {
                                this.showToast('删除成功', 'success');
                                if (this.groupMode) this.loadAllData();
                                else this.loadPage(this.currentPage, this.pageSize);
                            } else {
                                this.showToast('删除失败：' + res.msg, 'error');
                            }
                        });
                    }
                    return;
                }

                // 场景图点击
                const thumb = e.target.closest('.scene-thumb');
                if (thumb) {
                    const src = thumb.dataset.img || thumb.src;
                    if (src) this.openLightbox(src);
                    return;
                }
            });

            // 分页
            this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
            this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
            this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
            this.lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));
            this.goPageBtn.addEventListener('click', () => {
                let p = parseInt(this.pageInput.value);
                if (isNaN(p) || p < 1) p = 1;
                this.goToPage(p);
            });
            this.pageInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.goPageBtn.click(); });
            this.pageSizeSelect.addEventListener('change', () => {
                this.loadPage(1, parseInt(this.pageSizeSelect.value));
            });

            // 分组切换
            this.toggleGroupBtn.addEventListener('click', () => {
                this.groupMode = !this.groupMode;
                this.toggleGroupBtn.classList.toggle('btn-primary');
                this.toggleGroupBtn.classList.toggle('btn-outline');
                if (this.groupMode) {
                    this.groupField = this.groupFieldSelect.value;
                    this.toggleGroupBtn.innerHTML = '<i class="fas fa-table"></i> 表格视图';
                    this.showToast(`切换到分组视图（按 ${this.groupField}）`, 'info');
                    this.loadAllData();
                } else {
                    this.toggleGroupBtn.innerHTML = '<i class="fas fa-layer-group"></i> 分组视图';
                    this.showToast('切换到表格视图', 'info');
                    this.loadPage(this.currentPage, this.pageSize);
                }
            });

            this.groupFieldSelect.addEventListener('change', () => {
                if (this.groupMode) {
                    this.groupField = this.groupFieldSelect.value;
                    this.showToast(`分组字段已切换为：${this.groupField}`, 'info');
                    this.loadAllData();
                }
            });

            // 上传
            this.uploadBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => {
                if (this.fileInput.files && this.fileInput.files.length > 0) {
                    this.importFile(this.fileInput.files[0]);
                }
                this.fileInput.value = '';
            });
            this.uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); this.uploadZone.classList.add('dragover'); });
            this.uploadZone.addEventListener('dragleave', () => this.uploadZone.classList.remove('dragover'));
            this.uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files && files.length > 0 && files[0].name.endsWith('.csv')) {
                    this.importFile(files[0]);
                } else {
                    this.showToast('请上传 .csv 文件', 'warning');
                }
            });

            // 搜索
            this.searchBtn.addEventListener('click', () => this.doSimpleSearch());
            this.searchKeyword.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.doSimpleSearch(); });
            this.resetSearchBtn.addEventListener('click', () => this.resetSearch());
            this.bannerResetBtn.addEventListener('click', () => this.resetSearch());

            // 高级搜索
            this.toggleAdvancedBtn.addEventListener('click', () => {
                const isVisible = this.advancedSearch.style.display !== 'none';
                if (isVisible) {
                    this.advancedSearch.style.display = 'none';
                    this.searchField.disabled = false;
                    this.searchKeyword.disabled = false;
                    this.searchBtn.disabled = false;
                } else {
                    this.advancedSearch.style.display = 'block';
                    this.searchField.disabled = true;
                    this.searchKeyword.disabled = true;
                    this.searchBtn.disabled = true;
                    if (this.conditionsContainer.children.length === 0) {
                        this._addCondition();
                    }
                }
            });
            this.addConditionBtn.addEventListener('click', () => this._addCondition());
            this.clearConditionsBtn.addEventListener('click', () => {
                this.conditionsContainer.innerHTML = '';
                this.searchConditions = null;
            });
            this.advancedSearchBtn.addEventListener('click', () => this.doAdvancedSearch());

            // 新增/编辑模态框
            this.addRowBtn.addEventListener('click', () => this.openAddModal());
            this.addCancelBtn.addEventListener('click', () => this.closeAddModal());
            this.addConfirmBtn.addEventListener('click', () => this.confirmAddRow());
            this.addModal.addEventListener('click', (e) => { if (e.target === this.addModal) this.closeAddModal(); });

            this.editCancelBtn.addEventListener('click', () => this.closeEditModal());
            this.editConfirmBtn.addEventListener('click', () => this.confirmEditRow());
            this.editModal.addEventListener('click', (e) => { if (e.target === this.editModal) this.closeEditModal(); });

            // 导出
            this.exportBtn.addEventListener('click', () => this.exportCsv());
            this.exportExcelBtn.addEventListener('click', () => this.exportExcel());

            // 清空
            this.clearBtn.addEventListener('click', () => {
                if (confirm('清空所有数据？')) {
                    eel.clear_data()((res) => {
                        if (res.status === 'success') {
                            this.searchConditions = null;
                            if (this.groupMode) this.loadAllData();
                            else this.loadPage(1, this.pageSize);
                            this.hideBanner();
                            this.showToast('已清空', 'info');
                        }
                    });
                }
            });

            // 示例
            this.loadSampleBtn.addEventListener('click', () => {
                eel.load_sample_data()((res) => {
                    if (res.status === 'success') {
                        this.searchConditions = null;
                        if (this.groupMode) this.loadAllData();
                        else this.loadPage(1, this.pageSize);
                        this.showToast('示例数据加载完成', 'success');
                    } else {
                        this.showToast('加载示例失败：' + res.msg, 'error');
                    }
                });
            });

            // 列显示设置
            this.columnSettingsBtn.addEventListener('click', () => this.openColumnSettings());
            this.columnSettingsCancel.addEventListener('click', () => this.closeColumnSettings());
            this.columnSettingsConfirm.addEventListener('click', () => this.confirmColumnSettings());
            this.columnSettingsModal.addEventListener('click', (e) => { if (e.target === this.columnSettingsModal) this.closeColumnSettings(); });

            // Lightbox
            this.lightboxClose.addEventListener('click', () => this.closeLightbox());
            this.lightbox.addEventListener('click', (e) => { if (e.target === this.lightbox) this.closeLightbox(); });

            // 折叠/展开表头
            this.toggleHeaderBtn = this.$('#toggleHeaderBtn');
            this.headerCollapsible = this.$('#headerCollapsible');
            this.toggleHeaderBtn.addEventListener('click', () => this._toggleHeader());
        }

        _toggleHeader() {
            const el = this.headerCollapsible;
            const btn = this.toggleHeaderBtn;
            if (!el) return;
            el.classList.toggle('collapsed');
            const isCollapsed = el.classList.contains('collapsed');
            btn.innerHTML = isCollapsed ?
                '<i class="fas fa-chevron-down"></i>' :
                '<i class="fas fa-chevron-up"></i>';
            btn.title = isCollapsed ? '展开表头区域' : '折叠表头区域';
            // 可选：保存状态到 localStorage
            localStorage.setItem('header_collapsed', isCollapsed ? 'true' : 'false');
        }

        _addCondition(field = '', operator = 'contains', value = '') {
            const row = document.createElement('div');
            row.className = 'condition-row';

            const fieldSelect = document.createElement('select');
            fieldSelect.innerHTML = '<option value="">选择字段</option>';
            this.currentHeaders.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                if (h === field) opt.selected = true;
                fieldSelect.appendChild(opt);
            });

            const operatorSelect = document.createElement('select');
            operatorSelect.innerHTML = `
                <option value="contains" ${operator==='contains'?'selected':''}>包含</option>
                <option value="eq" ${operator==='eq'?'selected':''}>等于</option>
                <option value="ne" ${operator==='ne'?'selected':''}>不等于</option>
                <option value="startswith" ${operator==='startswith'?'selected':''}>开头是</option>
                <option value="endswith" ${operator==='endswith'?'selected':''}>结尾是</option>
                <option value="gt" ${operator==='gt'?'selected':''}>大于</option>
                <option value="lt" ${operator==='lt'?'selected':''}>小于</option>
                <option value="gte" ${operator==='gte'?'selected':''}>大于等于</option>
                <option value="lte" ${operator==='lte'?'selected':''}>小于等于</option>
                <option value="isnull" ${operator==='isnull'?'selected':''}>为空</option>
                <option value="notnull" ${operator==='notnull'?'selected':''}>不为空</option>
            `;

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = '搜索值';
            valueInput.value = value || '';
            valueInput.style.flex = '1';

            operatorSelect.addEventListener('change', () => {
                const op = operatorSelect.value;
                if (op === 'isnull' || op === 'notnull') {
                    valueInput.disabled = true;
                    valueInput.value = '';
                    valueInput.style.backgroundColor = '#f0f0f0';
                    valueInput.placeholder = '无需输入';
                } else {
                    valueInput.disabled = false;
                    valueInput.style.backgroundColor = '#fff';
                    valueInput.placeholder = '搜索值';
                }
            });
            // 初始化状态
            if (operator === 'isnull' || operator === 'notnull') {
                valueInput.disabled = true;
                valueInput.style.backgroundColor = '#f0f0f0';
                valueInput.placeholder = '无需输入';
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.className = 'btn btn-danger btn-xs';
            deleteBtn.onclick = () => row.remove();

            row.appendChild(fieldSelect);
            row.appendChild(operatorSelect);
            row.appendChild(valueInput);
            row.appendChild(deleteBtn);
            this.conditionsContainer.appendChild(row);
        }
        

        /**
         * 将当前行数据复制到系统剪贴板（以“字段名: 值”格式）
         */
        _copyRowToClipboard(rowIdx) {
            // 获取行数据
            let row;
            if (this.groupMode) {
                row = this.allData.find((item, idx) => idx === rowIdx);
                if (!row) {
                    this.showToast('未找到该行数据', 'error');
                    return;
                }
            } else {
                const localIdx = rowIdx - (this.currentPage - 1) * this.pageSize;
                if (localIdx < 0 || localIdx >= this.currentData.length) {
                    this.showToast('行索引无效', 'error');
                    return;
                }
                row = this.currentData[localIdx];
            }

            // 生成文本内容：用制表符分隔，便于粘贴到Excel
            const headers = this.currentHeaders;
            const values = headers.map(field => row[field] !== undefined ? String(row[field]) : '');
            // 格式1：键值对（易读）
            const text = headers.map((field, i) => `${field}: ${values[i]}`).join('\n');
            // 或者格式2：纯制表符分隔（适合Excel），可注释掉上面一行启用下面
            // const text = values.join('\t');

            // 写入剪贴板
            this._copyToClipboard(text);
        }

        /**
         * 通用剪贴板写入方法
         */
        _copyToClipboard(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        this.showToast('✅ 数据已复制到剪贴板', 'success');
                    })
                    .catch(err => {
                        this.showToast('复制失败：' + err.message, 'error');
                    });
            } else {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showToast('✅ 数据已复制到剪贴板', 'success');
                } catch (err) {
                    this.showToast('复制失败，请手动复制', 'error');
                }
                document.body.removeChild(textarea);
            }
        } 
    }

    // ============================================================
    // 启动应用
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new CaseManager();
    });
