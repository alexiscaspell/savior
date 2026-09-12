from app.utils.file_util import path_exists
import subprocess

class SshCredentials():
    def __init__(self,user:str,password:str=None,key_file:str=None):
        self.user = user
        self.password = password
        self.key_file = key_file

    def has_password_file(self):
        return self.password is not None and ("/" in self.password or path_exists(self.password))

def execute_command(bash_command:str,ip:str,creds:SshCredentials,port=22)->str:
    ssh_command=""

    if creds.password:
        if creds.has_password_file():
            ssh_command = f"sshpass -f '{creds.password}' "
        else:
            ssh_command = f"sshpass -p '{creds.password}' "

    ssh_command = ssh_command + f"ssh -o StrictHostKeyChecking=no {creds.user}@{ip} -p {port} "

    if creds.key_file:
        ssh_command = ssh_command+f"-i {creds.key_file} "

    ssh_command = ssh_command + bash_command

    process = subprocess.Popen(ssh_command, shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)

    output, error = process.communicate()

    return output