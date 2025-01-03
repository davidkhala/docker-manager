function Up {
    param (
        [string]$Uri,
        [switch]$Attach
    )
    $command = "up -d"

    if ($Attach) {
        $command = "up"
    }

    # Fetch the Docker Compose file and run the down command
    Invoke-RestMethod -Uri $Uri | docker-compose -f - $command
}