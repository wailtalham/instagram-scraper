document.getElementById('scrapeButton').addEventListener('click', function() {
    // Show spinner
    document.getElementById('spinner').style.display = 'block';
    // Hide previous success message if any
    document.getElementById('successMessage').style.display = 'none';

    fetch('/start-scrape', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log('Scrape successful:', data);
            // Hide spinner
            document.getElementById('spinner').style.display = 'none';
            // Show success message
            document.getElementById('successMessage').style.display = 'block';
        })
        .catch((error) => {
            console.error('Error:', error);
            // Hide spinner
            document.getElementById('spinner').style.display = 'none';
        });
});

function loadApkData() {
    fetch('/api/versions')
        .then(response => response.json())
        .then(data => {
            $('#apkTableBody').empty(); // Clear existing rows
            data.forEach(apk => {
                $('#apkTableBody').append(`
                    <tr>
                        <td>${apk.version}</td>
                        <td>${apk.releaseDate}</td>
                        <td>
                            <button data-id="${apk._id}" class="btn btn-primary btn-details">Details</button>
                            <button onclick="deleteApk('${apk._id}')" class="btn btn-danger">Delete</button>
                        </td>
                    </tr>
                `);
            });
        });
}

function loadApkDetails(id) {
    fetch('/api/versions/' + id)
        .then(response => response.json())
        .then(data => {
            $('#apkDetailsContent').html(`
                <p><strong>Version:</strong> ${data.version}</p>
                <p><strong>Release Date:</strong> ${data.releaseDate}</p>
                <!-- More details can be added here -->
            `);
            $('#detailsModal').modal('show');

            
        // Display variant detail
        const variantsContainer = document.getElementById('variantDetails');
            if (variantsContainer) {
                variantsContainer.innerHTML = '';
                data.variants.forEach((variant, index) => {
                    const variantId = `variant${index}`;
                    const variantDetail = document.createElement('div');
                    variantDetail.classList.add('card');
                    variantDetail.innerHTML = `
                        <div class="card-header" id="heading${variantId}">
                            <h5 class="mb-0">
                                <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${variantId}" aria-expanded="true" aria-controls="collapse${variantId}">
                                    Variant: ${variant.variantId}
                                </button>
                            </h5>
                        </div>
                        <div id="collapse${variantId}" class="collapse" aria-labelledby="heading${variantId}" data-parent="#variantDetails">
                            <div class="card-body">
                                <p>Architecture: ${variant.architecture}</p>
                                <p>Minimum Android Version: ${variant.minAndroidVersion}</p>
                                <p>DPI: ${variant.dpi}</p>
                            </div>
                        </div>
                    `;
                    variantsContainer.appendChild(variantDetail);
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

function deleteApk(id) {
    // Display confirmation dialog
    if (confirm("Are you sure you want to delete this APK version?")) {
        fetch('/api/versions/' + id, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                console.log('Delete successful:', data);
                loadApkData(); // Refresh data in the table
            })
            .catch(error => console.error('Error:', error));
    }
}



$(document).on('click', '.btn-details', function() {
    const apkId = $(this).data('id');
    loadApkDetails(apkId);
});

// Initially load data
loadApkData();


document.getElementById('agentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const agentString = document.getElementById('agentInput').value;
    checkAgentCompatibility(agentString);
});


function checkAgentCompatibility(agentString) {
    fetch('/api/versions/check-compatibility', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agent: agentString })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('This version is compatible with your device.');
        } else {
            alert('This version is not compatible with your device.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error checking compatibility.');
    });
}

// Dummy agent string for testing purposes
/* const agentString = "Instagram 263.2.0.19.104 Android (21; 280dpi; 720x1382; samsung; SM-A105F; a10; exynos7884B; en_IN; 366308842)";
checkAgentCompatibility(agentString); */