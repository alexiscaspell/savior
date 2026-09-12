import glob
import os
import time
from typing import List,Dict
import zipfile
import io
import shutil

def path_join(*args)->str:
    '''Joinea cualquier numero de paths '''
    is_first_element=True
    normalized_args = [args[0]]

    for arg in args:
        if is_first_element:
            is_first_element=False
            continue

        if len(arg)>1 and (arg[0]=="/" or arg[0]=="\\"):
            if len(arg)==1:
                arg = ""
            else:
                arg = arg[1:]

        normalized_args.append(arg)

    return os.path.join(*normalized_args)

def make_directory_if_not_exists(path):
    '''Crea un directorio si este no existe'''
    os.makedirs(path,exist_ok=True)

def get_file_name(path:str)->str:
    '''Retorna el nombre de archivo y extension de un path completo'''
    return path.split('/')[-1:][0]

def path_exists(path:str)->bool:
    '''Informa si una ruta existe'''
    return os.path.exists(path)
    
def is_dir(path:str)->bool:
    '''Retorna true si el path es un directorio y no un archivo'''
    return os.path.isdir(path)

def is_file(dir:str)->bool:
    '''Retorna true si el path es un archivo y no un directorio'''
    return not is_dir(dir)

def list_files(path:str)->List[str]:
    '''Lista tdos los archivos o directorios recursivamente dentro de dir'''
    path_a_listar = path if is_file(path) else path_join(path, "/**/*")

    return list(glob.iglob(path_a_listar, recursive=True))

def list_top_level_files(path:str)->List[str]:
    '''Lista tdos los archivos o directorios dentro del 1er nivel de dir'''
    return [path_join(path,name) for name in os.listdir(path)]

def delete_file(path:str):
    '''Elimina un archivo o directorio'''
    if not path_exists(path):
        return
        
    if is_file(path):
        os.remove(path)
    else:
        shutil.rmtree(path)

def copy_file(from_path:str,to_path:str,replace_if_exists=False,move=False):
    '''Copia, mueve o reemplaza un archivo o directorio de from_path a to_path'''
    if is_file(from_path):
            shutil.copy(from_path, to_path)
            return
            
    for src_dir, dirs, files in os.walk(from_path):
        dst_dir = src_dir.replace(from_path, to_path, 1)
        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)
        for file_ in files:
            src_file = os.path.join(src_dir, file_)
            dst_file = os.path.join(dst_dir, file_)
            if os.path.exists(dst_file):
                if not replace_if_exists:
                    continue
                # in case of the src and dst are the same file
                if os.path.samefile(src_file, dst_file):
                    continue
                os.remove(dst_file)
            if move:
                shutil.move(src_file, dst_dir)
            else:
                if is_file(src_file):
                        shutil.copy(src_file, dst_file)
                else:
                    shutil.copytree(src_file,dst_file)
    

def unzip_bytes(data:bytes,path:str):
    '''unzipea un archivo en el path especificado a traves de los bytes'''
    z = zipfile.ZipFile(io.BytesIO(data), "r")

    # z.read(path)        # Reads the data from "foo.txt"
    #z.read(z.infolist()[0]) # Reads the data from the first file

    filename = z.infolist()[0].filename
    filename = filename[:-1] if filename.endswith("/") else filename

    # last_char_index = path.rfind(filename)

    #REEMPLAZO EL NOMBRE DEL ARCHIVO POR VACION EN EL PATH ASI NO DUPLICA LAS CARPETAS
    # path_to_extract = path[:last_char_index] if last_char_index!=-1 else path

    make_directory_if_not_exists(path)

    z.extractall(path)

    copy_file(path_join(path,filename),path,replace_if_exists=True,move=True)

    delete_file(path_join(path,filename))         

    z.close()

def zip_file(file_path:str,zip_path:str):
    '''
    Crea un zip con el archivo en file_path
    '''

    shutil.make_archive(zip_path.replace(".zip",""), 'zip', file_path)