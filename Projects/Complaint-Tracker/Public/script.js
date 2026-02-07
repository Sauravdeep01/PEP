document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the Admin page or User page
    const isAdminPage = window.location.pathname.includes('admin.html');

    // --- Helper Function for Popups (Toast) ---
    function showToast(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ==========================================
    // USER PORTAL LOGIC (index.html)
    // ==========================================
    if (!isAdminPage) {
        const complaintForm = document.getElementById('complaintForm');

        if (complaintForm) {
            complaintForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const payload = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    subject: document.getElementById('subject').value,
                    description: document.getElementById('description').value
                };

                try {
                    const response = await fetch('/complaints', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        showToast('Complaint submitted successfully!', 'success');
                        complaintForm.reset();
                        fetchUserComplaints();
                    }
                } catch (err) {
                    showToast('Error!', 'error');
                }
            });
        }

        async function fetchUserComplaints() {
            const list = document.getElementById('complaintsList');
            if (!list) return;

            try {
                const res = await fetch('/complaints');
                const complaints = await res.json();

                // Clear existing content safely
                list.replaceChildren();

                if (complaints.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.textContent = 'No complaints found.';
                    list.appendChild(emptyMsg);
                    return;
                }

                // Append cards using real DOM elements
                complaints.reverse().forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'complaint-card admin-card'; // Reuse admin-card for consistent look

                    // Top: ID and Badge (Match admin style)
                    const topBar = document.createElement('div');
                    topBar.className = 'card-top';

                    const idTag = document.createElement('span');
                    idTag.className = 'comp-id-badge';
                    idTag.textContent = item.id;

                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge badge-${item.status}`;
                    statusBadge.textContent = item.status.toUpperCase();

                    topBar.appendChild(idTag);
                    topBar.appendChild(statusBadge);

                    // Subject
                    const subjectLine = document.createElement('div');
                    subjectLine.className = 'subject-line';
                    subjectLine.textContent = item.subject;

                    // Description (small text below subject)
                    const descriptionText = document.createElement('p');
                    descriptionText.className = 'description-text';
                    descriptionText.textContent = item.description;

                    // User Info with Icons
                    const userInfo = document.createElement('div');
                    userInfo.className = 'user-info-row';

                    // Name with icon
                    const nameWrapper = document.createElement('span');
                    nameWrapper.className = 'info-item';
                    const userIcon = document.createElement('i');
                    userIcon.className = 'fas fa-user info-icon';
                    nameWrapper.appendChild(userIcon);
                    nameWrapper.appendChild(document.createTextNode(item.name));

                    // Email with icon
                    const emailWrapper = document.createElement('span');
                    emailWrapper.className = 'info-item';
                    const mailIcon = document.createElement('i');
                    mailIcon.className = 'fas fa-envelope info-icon email-icon';
                    emailWrapper.appendChild(mailIcon);
                    emailWrapper.appendChild(document.createTextNode(item.email));

                    userInfo.appendChild(nameWrapper);
                    userInfo.appendChild(emailWrapper);

                    // Submitted Date
                    const dateInfo = document.createElement('div');
                    dateInfo.className = 'submitted-date';
                    const formattedDate = new Date(item.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    dateInfo.textContent = `Submitted: ${formattedDate}`;

                    // Assembly
                    card.appendChild(topBar);
                    card.appendChild(subjectLine);
                    card.appendChild(descriptionText);
                    card.appendChild(userInfo);
                    card.appendChild(dateInfo);

                    list.appendChild(card);
                });
            } catch (err) {
                console.error(err);
            }
        }

        fetchUserComplaints();
    }

    // ==========================================
    // ADMIN PANEL LOGIC (admin.html)
    // ==========================================
    if (isAdminPage) {
        let allComplaints = [];

        async function fetchAdminData() {
            try {
                const res = await fetch('/complaints');
                allComplaints = await res.json();
                updateStats(allComplaints);
                renderAdminList(allComplaints);
            } catch (err) {
                showToast('Load failed', 'error');
            }
        }

        function updateStats(data) {
            let p = 0, resCount = 0, rejCount = 0;
            data.forEach(c => {
                if (c.status === 'pending') p++;
                if (c.status === 'resolved') resCount++;
                if (c.status === 'rejected') rejCount++;
            });
            document.getElementById('totalCount').textContent = data.length;
            document.getElementById('pendingCount').textContent = p;
            document.getElementById('resolvedCount').textContent = resCount;
            document.getElementById('rejectedCount').textContent = rejCount;
        }

        function renderAdminList(data) {
            const container = document.getElementById('adminComplaintsList');
            const search = document.getElementById('adminSearch').value.toLowerCase();
            const filter = document.querySelector('.filter-btn.active').dataset.filter;

            if (!container) return;
            container.replaceChildren();

            const filtered = data.filter(c => {
                const matchStatus = (filter === 'all' || c.status === filter);
                const matchSearch = (
                    c.name.toLowerCase().includes(search) ||
                    c.id.toString().includes(search) ||
                    c.subject.toLowerCase().includes(search)
                );
                return matchStatus && matchSearch;
            });

            if (filtered.length === 0) {
                const noResult = document.createElement('p');
                noResult.textContent = 'No matching complaints found.';
                container.appendChild(noResult);
                return;
            }

            filtered.reverse().forEach(c => {
                const card = document.createElement('div');
                card.className = 'complaint-card admin-card';

                // Top: ID and Badge
                const topBar = document.createElement('div');
                topBar.className = 'card-top';

                const idTag = document.createElement('span');
                idTag.className = 'comp-id-badge';
                idTag.textContent = c.id;

                const badge = document.createElement('span');
                badge.className = `badge badge-${c.status}`;
                badge.textContent = c.status.toUpperCase();

                topBar.appendChild(idTag);
                topBar.appendChild(badge);

                // Subject Line
                const subjectLine = document.createElement('div');
                subjectLine.className = 'subject-line';
                subjectLine.textContent = c.subject;

                // Description (small text below subject)
                const descriptionText = document.createElement('p');
                descriptionText.className = 'description-text';
                descriptionText.textContent = c.description;

                // User Info with Icons
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info-row';

                // Name with icon
                const nameWrapper = document.createElement('span');
                nameWrapper.className = 'info-item';
                const userIcon = document.createElement('i');
                userIcon.className = 'fas fa-user info-icon';
                nameWrapper.appendChild(userIcon);
                nameWrapper.appendChild(document.createTextNode(c.name));

                // Email with icon
                const emailWrapper = document.createElement('span');
                emailWrapper.className = 'info-item';
                const mailIcon = document.createElement('i');
                mailIcon.className = 'fas fa-envelope info-icon email-icon';
                emailWrapper.appendChild(mailIcon);
                emailWrapper.appendChild(document.createTextNode(c.email));

                userInfo.appendChild(nameWrapper);
                userInfo.appendChild(emailWrapper);

                // Submitted Date
                const dateInfo = document.createElement('div');
                dateInfo.className = 'submitted-date';
                const formattedDate = new Date(c.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                dateInfo.textContent = `Submitted: ${formattedDate}`;

                // Admin Actions
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'admin-actions';

                // Resolve Button
                const resBtn = document.createElement('button');
                resBtn.textContent = 'Resolve';
                resBtn.className = 'btn-resolve';
                resBtn.addEventListener('click', () => updateStatus(c.id, 'resolved'));

                // Reject Button
                const rejBtn = document.createElement('button');
                rejBtn.textContent = 'Reject';
                rejBtn.className = 'btn-reject';
                rejBtn.addEventListener('click', () => updateStatus(c.id, 'rejected'));

                // Delete Button
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.className = 'btn-delete';
                delBtn.addEventListener('click', () => deleteComplaint(c.id));

                actionsDiv.appendChild(resBtn);
                actionsDiv.appendChild(rejBtn);
                actionsDiv.appendChild(delBtn);

                // Final Assembly
                card.appendChild(topBar);
                card.appendChild(subjectLine);
                card.appendChild(descriptionText);
                card.appendChild(userInfo);
                card.appendChild(dateInfo);
                card.appendChild(actionsDiv);

                container.appendChild(card);
            });
        }

        async function updateStatus(id, newStatus) {
            const res = await fetch(`/complaints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showToast(`Updated to ${newStatus}`, 'success');
                fetchAdminData();
            }
        }

        async function deleteComplaint(id) {
            if (!confirm('Are you sure you want to delete this?')) return;
            const res = await fetch(`/complaints/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Deleted!', 'success');
                fetchAdminData();
            }
        }

        // Listeners for filter/search
        document.getElementById('adminSearch').addEventListener('input', () => renderAdminList(allComplaints));
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                renderAdminList(allComplaints);
            });
        });

        fetchAdminData();
    }
});
