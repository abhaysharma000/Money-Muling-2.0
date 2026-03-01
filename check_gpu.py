import torch
import sys

def check_gpu():
    print(f"Python Version: {sys.version}")
    print(f"Torch Version: {torch.__version__}")
    
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available: {cuda_available}")
    
    if cuda_available:
        print(f"GPU Device: {torch.cuda.get_device_name(0)}")
        print(f"Memory Allocated: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")
    else:
        print("No GPU detected. System is running in CPU mode.")

if __name__ == "__main__":
    check_gpu()
